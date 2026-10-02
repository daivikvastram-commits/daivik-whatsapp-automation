/**
 * Application constants and configuration values
 */

const CONSTANTS = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // WhatsApp Configuration
  WHATSAPP: {
    RATE_LIMIT: 80, // Messages per second
    MAX_BATCH_SIZE: 10000,
    MIN_PHONE_LENGTH: 10,
    MAX_PHONE_LENGTH: 15,
    MESSAGE_TIMEOUT: 30000, // 30 seconds
    DEFAULT_IMAGE_URL: 'https://www.gstatic.com/webp/gallery/1.jpg'
  },

  // Error Codes
  ERROR_CODES: {
    MISSING_ENV: 'MISSING_ENV_VAR',
    INVALID_PHONE: 'INVALID_PHONE_NUMBER',
    INVALID_CONTACTS: 'INVALID_CONTACTS_ARRAY',
    INVALID_CAMPAIGN: 'INVALID_CAMPAIGN_NAME',
    QUEUE_PROCESSING: 'QUEUE_ALREADY_PROCESSING',
    SEND_FAILED: 'MESSAGE_SEND_FAILED',
    CAMPAIGN_NOT_FOUND: 'CAMPAIGN_NOT_FOUND',
    INVALID_REQUEST: 'INVALID_REQUEST'
  },

  // Environment variables required
  REQUIRED_ENV_VARS: [
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID'
  ],

  // Service timeouts
  TIMEOUTS: {
    HTTP_REQUEST: 30000,
    QUEUE_PROCESS: 300000
  },

  // Firebase collections
  FIREBASE: {
    CAMPAIGNS: 'campaigns',
    CONTACTS: 'contacts'
  }
};

module.exports = CONSTANTS;
