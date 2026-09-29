require("./config/firebase");

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const app = require("./server");

const WHATSAPP_ACCESS_TOKEN =
  defineSecret("WHATSAPP_ACCESS_TOKEN");

const WHATSAPP_PHONE_NUMBER_ID =
  defineSecret("WHATSAPP_PHONE_NUMBER_ID");

const SHOPIFY_CLIENT_ID =
  defineSecret("SHOPIFY_CLIENT_ID");

const SHOPIFY_CLIENT_SECRET =
  defineSecret("SHOPIFY_CLIENT_SECRET");

const SHOPIFY_ACCESS_TOKEN =
  defineSecret("SHOPIFY_ACCESS_TOKEN");

const SHOPIFY_STORE_DOMAIN =
  defineSecret("SHOPIFY_STORE_DOMAIN");

exports.api = onRequest(
  {
    secrets: [
      WHATSAPP_ACCESS_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID,
      SHOPIFY_CLIENT_ID,
      SHOPIFY_CLIENT_SECRET,
      SHOPIFY_ACCESS_TOKEN,
      SHOPIFY_STORE_DOMAIN
    ]
  },
  app
);