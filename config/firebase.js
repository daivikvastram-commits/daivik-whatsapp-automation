const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId:
      process.env.GCLOUD_PROJECT ||
      process.env.GCP_PROJECT ||
      "whatsapp-automation-1efb0"
  });
}

module.exports = admin;
