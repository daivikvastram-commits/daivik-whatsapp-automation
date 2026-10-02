const bulkSender = require("../services/bulkWhatsappService");
const logger = require("../utils/logger");
const CONSTANTS = require("../utils/constants");

/**
 * Send bulk messages to contacts
 * POST /bulk/send
 * Body: { contacts: [{ phone, bodyParams }, ...], campaignName?: string, saveCampaign?: boolean }
 */
async function sendBulkMessages(req, res) {
  try {
    const { contacts, campaignName, saveCampaign } = req.body;

    // Validation
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: "contacts array is required and must not be empty",
        code: CONSTANTS.ERROR_CODES.INVALID_CONTACTS
      });
    }

    if (contacts.length > CONSTANTS.WHATSAPP.MAX_BATCH_SIZE) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: `Maximum ${CONSTANTS.WHATSAPP.MAX_BATCH_SIZE} contacts per batch`,
        code: CONSTANTS.ERROR_CODES.INVALID_CONTACTS
      });
    }

    // Save campaign if requested
    let campaignId = null;
    if (saveCampaign && campaignName) {
      const campaign = await bulkSender.saveCampaign(campaignName, contacts);
      campaignId = campaign.campaignId;
      logger.info("Campaign saved during bulk send", { campaignId });
    }

    // Add to queue
    const queueInfo = bulkSender.addBatchToQueue(contacts);
    logger.info("Bulk messages queued", { count: contacts.length, queueSize: queueInfo.queueSize });

    res.status(CONSTANTS.HTTP_STATUS.ACCEPTED).json({
      status: "accepted",
      message: `${contacts.length} messages queued for sending`,
      queueSize: queueInfo.queueSize,
      campaignId,
      nextAction: "GET /bulk/status to monitor progress"
    });

    // Process asynchronously (fire and forget)
    bulkSender.processQueue().catch(error => {
      logger.error("Queue processing error", { error: error.message });
    });
  } catch (error) {
    logger.error("Bulk send request error", { error: error.message });
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message,
      code: CONSTANTS.ERROR_CODES.INVALID_REQUEST
    });
  }
}

/**
 * Get bulk send queue status
 * GET /bulk/status
 */
function getBulkStatus(req, res) {
  try {
    const status = bulkSender.getQueueStatus();
    res.json({
      queueStatus: status,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    logger.error("Status check error", { error: error.message });
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message
    });
  }
}

/**
 * Clear queue
 * POST /bulk/clear
 */
function clearBulkQueue(req, res) {
  try {
    const result = bulkSender.clearQueue();
    logger.info("Queue cleared");
    res.json({
      status: "cleared",
      ...result
    });
  } catch (error) {
    logger.error("Clear queue error", { error: error.message });
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message
    });
  }
}

/**
 * Create new campaign
 * POST /bulk/campaign/create
 * Body: { name, contacts, metadata }
 */
async function createCampaign(req, res) {
  try {
    const { name, contacts, metadata } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: "Campaign name is required and must be a non-empty string",
        code: CONSTANTS.ERROR_CODES.INVALID_CAMPAIGN
      });
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: "contacts array is required and must not be empty",
        code: CONSTANTS.ERROR_CODES.INVALID_CONTACTS
      });
    }

    const campaign = await bulkSender.saveCampaign(name.trim(), contacts, metadata);
    logger.info("Campaign created", { campaignId: campaign.campaignId, name });

    res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
      status: "created",
      campaign
    });
  } catch (error) {
    logger.error("Campaign creation error", { error: error.message });
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message,
      code: CONSTANTS.ERROR_CODES.INVALID_REQUEST
    });
  }
}

/**
 * Get campaign details
 * GET /bulk/campaign/:campaignId
 */
async function getCampaign(req, res) {
  try {
    const { campaignId } = req.params;

    if (!campaignId) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: "Campaign ID is required",
        code: CONSTANTS.ERROR_CODES.INVALID_REQUEST
      });
    }

    const campaign = await bulkSender.getCampaignDetails(campaignId);
    res.json({ campaign });
  } catch (error) {
    const isNotFound = error.message && error.message.includes("not found");
    const statusCode = isNotFound
      ? CONSTANTS.HTTP_STATUS.NOT_FOUND
      : CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR;

    logger.error("Campaign fetch error", { campaignId: req.params.campaignId, error: error.message });
    res.status(statusCode).json({
      error: error.message,
      code: isNotFound ? CONSTANTS.ERROR_CODES.CAMPAIGN_NOT_FOUND : CONSTANTS.ERROR_CODES.INVALID_REQUEST
    });
  }
}

/**
 * Send campaign to all contacts
 * POST /bulk/campaign/:campaignId/send
 */
async function sendCampaign(req, res) {
  try {
    const { campaignId } = req.params;

    if (!campaignId) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: "Campaign ID is required",
        code: CONSTANTS.ERROR_CODES.INVALID_REQUEST
      });
    }

    const result = await bulkSender.sendCampaign(campaignId);
    logger.info("Campaign send initiated", { campaignId });

    res.status(CONSTANTS.HTTP_STATUS.ACCEPTED).json({
      status: "processing",
      ...result,
      message: "Campaign is being processed. Check status using campaign ID."
    });
  } catch (error) {
    const isNotFound = error.message && error.message.includes("not found");
    const statusCode = isNotFound
      ? CONSTANTS.HTTP_STATUS.NOT_FOUND
      : CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR;

    logger.error("Campaign send error", { campaignId: req.params.campaignId, error: error.message });
    res.status(statusCode).json({
      error: error.message,
      code: isNotFound ? CONSTANTS.ERROR_CODES.CAMPAIGN_NOT_FOUND : CONSTANTS.ERROR_CODES.INVALID_REQUEST
    });
  }
}

/**
 * Quick test send - single message to test the template
 * POST /bulk/test
 * Body: { phone, bodyParams }
 */
async function testSend(req, res) {
  try {
    const { phone, bodyParams } = req.body;

    if (!phone) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: "phone is required",
        code: CONSTANTS.ERROR_CODES.INVALID_PHONE
      });
    }

    logger.info("Test message send requested", { phone });
    const result = await bulkSender.sendMataRaniTemplate(phone, bodyParams);

    if (result.success) {
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        status: "success",
        message: "Test message sent successfully",
        result
      });
    } else {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        status: "failed",
        message: "Failed to send test message",
        result
      });
    }
  } catch (error) {
    logger.error("Test send error", { error: error.message });
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message,
      code: CONSTANTS.ERROR_CODES.SEND_FAILED
    });
  }
}

module.exports = {
  sendBulkMessages,
  getBulkStatus,
  clearBulkQueue,
  createCampaign,
  getCampaign,
  sendCampaign,
  testSend
};
