const axios = require("axios");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("../utils/logger");
const CONSTANTS = require("../utils/constants");

const db = getFirestore();

/**
 * Bulk WhatsApp Message Sender Service
 * Handles queue management, rate limiting, and batch processing for Meta WhatsApp Cloud API
 */
class BulkWhatsappSender {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.rateLimit = CONSTANTS.WHATSAPP.RATE_LIMIT;
    this.processingDelay = 1000 / this.rateLimit;
    this.validateEnvironment();
  }

  /**
   * Validate required environment variables at startup
   */
  validateEnvironment() {
    const missingVars = CONSTANTS.REQUIRED_ENV_VARS.filter(
      varName => !process.env[varName]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }
  }

  /**
   * Get Meta Graph API URL
   */
  getApiUrl() {
    const version = process.env.META_GRAPH_API_VERSION || "v23.0";
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    return `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  }

  /**
   * Normalize phone number to WhatsApp format (91 country code for India)
   * Handles: 10-digit, 12-digit, leading zeros, existing country codes
   */
  normalizePhone(phone) {
    let value = String(phone || "").replace(/\D/g, "");

    // Remove leading zero and add country code
    if (value.startsWith("0")) {
      value = "91" + value.substring(1);
    }

    // Add country code if 10 digits
    if (value.length === 10) {
      value = "91" + value;
    }

    // Validate final length
    const isValid = value.length >= CONSTANTS.WHATSAPP.MIN_PHONE_LENGTH &&
                    value.length <= CONSTANTS.WHATSAPP.MAX_PHONE_LENGTH;

    if (!isValid) {
      throw new Error(
        `Invalid phone number: ${phone} (formatted as ${value})`
      );
    }

    return value;
  }

  /**
   * Send Mata Rani Template Message via Meta WhatsApp Cloud API
   * @param {string} to - Phone number
   * @param {array} bodyParams - Body parameters (ignored for image-only format)
   * @returns {Promise<object>} Send result with messageId or error
   */
  async sendMataRaniTemplate(to, bodyParams = []) {
    const normalizedPhone = this.normalizePhone(to);

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedPhone,
      type: "template",
      template: {
        name: "mata_rani_new_collections",
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: process.env.MATA_RANI_IMAGE_URL ||
                    CONSTANTS.WHATSAPP.DEFAULT_IMAGE_URL
                }
              }
            ]
          }
        ]
      }
    };

    try {
      const response = await axios.post(
        this.getApiUrl(),
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          },
          timeout: CONSTANTS.WHATSAPP.MESSAGE_TIMEOUT
        }
      );

      const messageId = response.data.messages?.[0]?.id;
      logger.info(`Message sent`, { phone: normalizedPhone, messageId });

      return {
        success: true,
        phone: normalizedPhone,
        messageId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message ||
                          error.message ||
                          "Unknown error";
      logger.error(`Message send failed`, {
        phone: normalizedPhone,
        error: errorMessage,
        code: error.response?.data?.error?.code
      });

      return {
        success: false,
        phone: normalizedPhone,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Add message to queue
   */
  addToQueue(phone, bodyParams = []) {
    this.queue.push({
      phone,
      bodyParams,
      status: "pending",
      addedAt: new Date().toISOString()
    });

    return {
      queueSize: this.queue.length,
      message: `Phone ${phone} added to queue`
    };
  }

  /**
   * Add multiple messages to queue
   */
  addBatchToQueue(contacts) {
    if (!Array.isArray(contacts)) {
      throw new Error("Contacts must be an array");
    }

    contacts.forEach(contact => {
      const phone = contact.phone || contact;
      const bodyParams = contact.bodyParams || [];
      this.addToQueue(phone, bodyParams);
    });

    return {
      queueSize: this.queue.length,
      message: `${contacts.length} contacts added to queue`
    };
  }

  /**
   * Process queue with rate limiting
   * @param {function} onProgress - Callback for progress updates
   * @returns {Promise<object>} Results summary
   */
  async processQueue(onProgress) {
    if (this.isProcessing) {
      logger.warn("Queue already processing");
      return;
    }

    this.isProcessing = true;
    const results = {
      sent: 0,
      failed: 0,
      total: this.queue.length,
      details: []
    };

    logger.info("Bulk send started", { total: this.queue.length });

    while (this.queue.length > 0) {
      const job = this.queue.shift();

      try {
        const result = await this.sendMataRaniTemplate(job.phone, job.bodyParams);

        if (result.success) {
          results.sent++;
          job.status = "sent";
        } else {
          results.failed++;
          job.status = "failed";
          job.error = result.error;
        }

        results.details.push(result);

        if (onProgress) {
          onProgress({
            processed: results.sent + results.failed,
            total: results.total,
            sent: results.sent,
            failed: results.failed
          });
        }

        // Rate limiting delay
        await this.delay(this.processingDelay);
      } catch (error) {
        results.failed++;
        job.status = "error";
        job.error = error.message;
        results.details.push({
          success: false,
          phone: job.phone,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        logger.error(`Queue job failed`, { phone: job.phone, error: error.message });
      }
    }

    this.isProcessing = false;

    logger.info("Bulk send completed", {
      sent: results.sent,
      failed: results.failed,
      total: results.total
    });

    return results;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      queue: this.queue.map(job => ({
        phone: job.phone,
        status: job.status,
        addedAt: job.addedAt
      }))
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    const count = this.queue.length;
    this.queue = [];
    return { message: `Cleared ${count} messages from queue` };
  }

  /**
   * Helper: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Save bulk send campaign to Firebase
   * @param {string} campaignName - Campaign name
   * @param {array} contacts - Array of contacts
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} Campaign details with ID
   */
  async saveCampaign(campaignName, contacts, metadata = {}) {
    if (!campaignName) {
      throw new Error("Campaign name is required");
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new Error("Contacts must be a non-empty array");
    }

    const campaign = {
      name: campaignName,
      totalContacts: contacts.length,
      status: "pending",
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      results: {
        sent: 0,
        failed: 0,
        total: 0
      }
    };

    try {
      const docRef = await db.collection(CONSTANTS.FIREBASE.CAMPAIGNS).add(campaign);

      // Save contacts in batch
      const batch = db.batch();
      contacts.forEach(contact => {
        const contactRef = db
          .collection(CONSTANTS.FIREBASE.CAMPAIGNS)
          .doc(docRef.id)
          .collection(CONSTANTS.FIREBASE.CONTACTS)
          .doc();
        batch.set(contactRef, {
          phone: contact.phone || contact,
          bodyParams: contact.bodyParams || [],
          status: "pending",
          createdAt: new Date().toISOString()
        });
      });

      await batch.commit();

      logger.info("Campaign saved", { campaignId: docRef.id, name: campaignName });

      return {
        campaignId: docRef.id,
        name: campaignName,
        totalContacts: contacts.length,
        status: "ready"
      };
    } catch (error) {
      logger.error("Campaign save failed", { name: campaignName, error: error.message });
      throw error;
    }
  }

  /**
   * Get campaign details from Firebase
   * @param {string} campaignId - Campaign document ID
   * @returns {Promise<object>} Campaign data with contacts
   */
  async getCampaignDetails(campaignId) {
    try {
      const campaign = await db
        .collection(CONSTANTS.FIREBASE.CAMPAIGNS)
        .doc(campaignId)
        .get();

      if (!campaign.exists) {
        throw new Error("Campaign not found");
      }

      const contacts = await db
        .collection(CONSTANTS.FIREBASE.CAMPAIGNS)
        .doc(campaignId)
        .collection(CONSTANTS.FIREBASE.CONTACTS)
        .get();

      logger.debug("Campaign details fetched", { campaignId });

      return {
        ...campaign.data(),
        campaignId,
        contactCount: contacts.size,
        contacts: contacts.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };
    } catch (error) {
      logger.error("Campaign fetch failed", { campaignId, error: error.message });
      throw error;
    }
  }

  /**
   * Send campaign to all contacts
   * @param {string} campaignId - Campaign document ID
   * @param {function} onProgress - Progress callback
   * @returns {Promise<object>} Campaign results
   */
  async sendCampaign(campaignId, onProgress) {
    try {
      const campaign = await this.getCampaignDetails(campaignId);

      if (campaign.status === "completed") {
        throw new Error("Campaign already completed");
      }

      // Update campaign status
      await db.collection(CONSTANTS.FIREBASE.CAMPAIGNS).doc(campaignId).update({
        status: "processing",
        startedAt: new Date().toISOString()
      });

      // Add to queue and process
      this.addBatchToQueue(campaign.contacts);
      const results = await this.processQueue(onProgress);

      // Update campaign with results
      await db.collection(CONSTANTS.FIREBASE.CAMPAIGNS).doc(campaignId).update({
        status: "completed",
        results,
        completedAt: new Date().toISOString()
      });

      logger.info("Campaign send completed", { campaignId, ...results });

      return {
        campaignId,
        results
      };
    } catch (error) {
      logger.error("Campaign send failed", { campaignId, error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new BulkWhatsappSender();
