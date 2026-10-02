const express = require("express");
const router = express.Router();
const {
  sendBulkMessages,
  getBulkStatus,
  clearBulkQueue,
  createCampaign,
  getCampaign,
  sendCampaign,
  testSend
} = require("../controllers/bulkWhatsappController");

/**
 * Bulk Message Endpoints
 */

// Send bulk messages
router.post("/send", sendBulkMessages);

// Get queue status
router.get("/status", getBulkStatus);

// Clear queue
router.post("/clear", clearBulkQueue);

// Test send single message
router.post("/test", testSend);

/**
 * Campaign Endpoints
 */

// Create campaign
router.post("/campaign/create", createCampaign);

// Get campaign details
router.get("/campaign/:campaignId", getCampaign);

// Send campaign
router.post("/campaign/:campaignId/send", sendCampaign);

module.exports = router;
