const {
  handleIncomingMessage,
  handleStatusUpdate
} = require("../services/whatsappService");

function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("WhatsApp verification request");

  if (
    mode === "subscribe" &&
    token &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }

  console.log("WhatsApp webhook verification failed");
  return res.sendStatus(403);
}

function receiveWebhook(req, res) {
  // Respond immediately so Meta does not retry unnecessarily.
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      console.log("Ignoring non-WhatsApp webhook");
      return;
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};

        for (const message of value.messages || []) {
          handleIncomingMessage(message, value);
        }

        for (const status of value.statuses || []) {
          handleStatusUpdate(status);
        }
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
  }
}

module.exports = {
  verifyWebhook,
  receiveWebhook
};