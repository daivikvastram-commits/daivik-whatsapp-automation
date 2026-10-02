const functions = require("firebase-functions");
const app = require("../server");

// Export as HTTP Cloud Function
// Firebase automatically handles PORT=8080 and other environment variables
exports.daivik = functions.https.onRequest(app);

