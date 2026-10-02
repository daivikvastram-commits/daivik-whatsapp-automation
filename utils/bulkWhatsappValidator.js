/**
 * Bulk WhatsApp Validation and Utilities
 */

/**
 * Validate phone number
 */
function validatePhone(phone) {
  if (!phone) {
    return {
      valid: false,
      error: "Phone number is required"
    };
  }

  const cleaned = String(phone).replace(/\D/g, "");

  // Check length
  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      valid: false,
      error: `Phone must be 10-15 digits, got ${cleaned.length}`
    };
  }

  return {
    valid: true,
    cleaned
  };
}

/**
 * Validate contact object
 */
function validateContact(contact) {
  if (!contact) {
    return {
      valid: false,
      error: "Contact is required"
    };
  }

  // Handle string phone numbers
  if (typeof contact === "string") {
    const phoneValidation = validatePhone(contact);
    return phoneValidation;
  }

  // Handle object contacts
  if (typeof contact === "object" && contact.phone) {
    const phoneValidation = validatePhone(contact.phone);

    if (!phoneValidation.valid) {
      return phoneValidation;
    }

    // Validate bodyParams if present
    if (contact.bodyParams !== undefined && !Array.isArray(contact.bodyParams)) {
      return {
        valid: false,
        error: "bodyParams must be an array"
      };
    }

    return {
      valid: true,
      contact: {
        phone: contact.phone,
        bodyParams: contact.bodyParams || []
      }
    };
  }

  return {
    valid: false,
    error: "Contact must have phone property or be a string"
  };
}

/**
 * Validate contacts batch
 */
function validateContactsBatch(contacts) {
  const errors = [];
  const valid = [];

  if (!Array.isArray(contacts)) {
    return {
      valid: false,
      error: "Contacts must be an array"
    };
  }

  if (contacts.length === 0) {
    return {
      valid: false,
      error: "Contacts array cannot be empty"
    };
  }

  if (contacts.length > 10000) {
    return {
      valid: false,
      error: `Maximum 10,000 contacts per batch, got ${contacts.length}`
    };
  }

  contacts.forEach((contact, index) => {
    const validation = validateContact(contact);

    if (!validation.valid) {
      errors.push({
        index,
        contact,
        error: validation.error
      });
    } else {
      valid.push(validation.contact || contact);
    }
  });

  return {
    valid: errors.length === 0,
    validContacts: valid,
    invalidContacts: errors,
    totalContacts: contacts.length,
    validCount: valid.length,
    invalidCount: errors.length
  };
}

/**
 * Validate campaign name
 */
function validateCampaignName(name) {
  if (!name) {
    return {
      valid: false,
      error: "Campaign name is required"
    };
  }

  if (typeof name !== "string") {
    return {
      valid: false,
      error: "Campaign name must be a string"
    };
  }

  if (name.length < 3) {
    return {
      valid: false,
      error: "Campaign name must be at least 3 characters"
    };
  }

  if (name.length > 100) {
    return {
      valid: false,
      error: "Campaign name must be at most 100 characters"
    };
  }

  return {
    valid: true,
    name: name.trim()
  };
}

/**
 * Check environment variables
 */
function validateEnvironment() {
  const required = [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID"
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing environment variables: ${missing.join(", ")}`
    };
  }

  return {
    valid: true,
    config: {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      apiVersion: process.env.META_GRAPH_API_VERSION || "v23.0",
      mataRaniImageUrl:
        process.env.MATA_RANI_IMAGE_URL ||
        "https://res.cloudinary.com/daivik/image/upload/v1/mata-rani-new-collections.jpg"
    }
  };
}

/**
 * Format campaign results
 */
function formatResults(results) {
  return {
    summary: {
      total: results.total,
      sent: results.sent,
      failed: results.failed,
      successRate: `${Math.round((results.sent / results.total) * 100)}%`
    },
    statistics: {
      sentPercentage: (results.sent / results.total) * 100,
      failurePercentage: (results.failed / results.total) * 100
    },
    details: results.details
  };
}

/**
 * Paginate contacts
 */
function paginateContacts(contacts, pageSize = 100, pageNumber = 1) {
  const start = (pageNumber - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: contacts.slice(start, end),
    total: contacts.length,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(contacts.length / pageSize),
    hasNextPage: end < contacts.length,
    hasPreviousPage: pageNumber > 1
  };
}

/**
 * Generate batch chunks
 */
function chunkArray(array, chunkSize) {
  const chunks = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * Format timestamp
 */
function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

/**
 * Parse campaign status
 */
function parseCampaignStatus(campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    totalContacts: campaign.totalContacts,
    sent: campaign.results?.sent || 0,
    failed: campaign.results?.failed || 0,
    remaining: campaign.totalContacts - (campaign.results?.sent || 0) - (campaign.results?.failed || 0),
    successRate: campaign.results
      ? `${Math.round((campaign.results.sent / campaign.totalContacts) * 100)}%`
      : "0%",
    createdAt: campaign.createdAt,
    startedAt: campaign.startedAt,
    completedAt: campaign.completedAt
  };
}

module.exports = {
  validatePhone,
  validateContact,
  validateContactsBatch,
  validateCampaignName,
  validateEnvironment,
  formatResults,
  paginateContacts,
  chunkArray,
  formatTimestamp,
  parseCampaignStatus
};
