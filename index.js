require("./config/firebase");

const { onRequest } = require("firebase-functions/v2/https");
const app = require("./server");

// Export as HTTP Cloud Function v2
// Cloud Run automatically manages PORT and other environment variables
exports.daivik = onRequest(app);
