const axios = require("axios");

const SHOPIFY_API_VERSION = "2026-07";

const STATIC_LOGO_URL =
  "https://daivikvastram.com/cdn/shop/files/Fixed_Logo.png?v=1778159991&width=375";

let cachedToken = null;
let tokenExpiresAt = 0;

async function getShopifyAccessToken() {
  const directToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (directToken) {
    return directToken;
  }

  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!clientId) {
    throw new Error("SHOPIFY_CLIENT_ID is missing");
  }

  if (!clientSecret) {
    throw new Error("SHOPIFY_CLIENT_SECRET is missing");
  }

  if (!shopDomain) {
    throw new Error("SHOPIFY_STORE_DOMAIN is missing");
  }

  const url =
    `https://${shopDomain}/admin/oauth/access_token`;

  const response = await axios.post(
    url,
    {
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.data?.access_token) {
    throw new Error("Shopify access token was not returned");
  }

  cachedToken = response.data.access_token;

  const expiresIn =
    Number(response.data.expires_in) || 86400;

  tokenExpiresAt =
    Date.now() + expiresIn * 1000;

  console.log("Shopify access token generated");

  return cachedToken;
}

async function shopifyGraphQL(query, variables = {}) {
  const token = await getShopifyAccessToken();

  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN;

  const url =
    `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  const response = await axios.post(
    url,
    {
      query,
      variables
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token
      }
    }
  );

  if (response.data?.errors?.length) {
    throw new Error(
      response.data.errors
        .map(error => error.message)
        .join(", ")
    );
  }

  return response.data?.data || {};
}

async function getProductInfo(productId) {
  return {
    title: "Your product",
    imageUrl: STATIC_LOGO_URL
  };
}

async function addOrderTag(shopifyOrderId, tag) {
  if (!shopifyOrderId) {
    throw new Error("Shopify Order ID is missing");
  }

  const orderGid = String(shopifyOrderId).startsWith("gid://")
    ? String(shopifyOrderId)
    : `gid://shopify/Order/${shopifyOrderId}`;

  const query = `
    mutation addTags($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyGraphQL(
    query,
    {
      id: orderGid,
      tags: [tag]
    }
  );

  const errors = data.tagsAdd?.userErrors || [];

  if (!data.tagsAdd) {
    throw new Error("Shopify did not return a tagsAdd response");
  }

  if (errors.length) {
    throw new Error(
      errors
        .map(error => error.message)
        .join(", ")
    );
  }

  console.log(
    `Shopify tag added: ${tag} → Order ${shopifyOrderId}`
  );

  return data.tagsAdd;
}

module.exports = {
  getShopifyAccessToken,
  shopifyGraphQL,
  getProductInfo,
  addOrderTag
};