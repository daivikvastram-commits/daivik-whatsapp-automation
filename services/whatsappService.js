const axios = require("axios");
const { getFirestore } = require("firebase-admin/firestore");
const { addOrderTag } = require("./shopifyService");

const db = getFirestore();

function apiUrl() {
  const version = process.env.META_GRAPH_API_VERSION || "v23.0";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  return `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
}

// ==========================================
// SEND TEXT MESSAGE
// ==========================================

async function sendTextMessage(to, body) {
  if (!process.env.WHATSAPP_ACCESS_TOKEN) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is missing");
  }

  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is missing");
  }

  const response = await axios.post(
    apiUrl(),
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );

  console.log("WhatsApp message sent:", response.data);

  return response.data;
}

// ==========================================
// SEND TEMPLATE MESSAGE
// WITH IMAGE HEADER
// ==========================================

async function sendTemplateMessage(
  to,
  templateName,
  languageCode = "en",
  bodyParameters = [],
  imageUrl = null
) {
  const components = [];

  // IMAGE HEADER
  if (imageUrl) {
    components.push({
      type: "header",
      parameters: [
        {
          type: "image",
          image: {
            link: imageUrl
          }
        }
      ]
    });
  }

  // BODY VARIABLES
  if (bodyParameters.length) {
    components.push({
      type: "body",
      parameters: bodyParameters.map(value => ({
        type: "text",
        text: String(value)
      }))
    });
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      },
      components
    }
  };

  const response = await axios.post(
    apiUrl(),
    payload,
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );

  console.log("WhatsApp template sent:", response.data);

  return response.data;
}

// ==========================================
// NORMALIZE PHONE
// ==========================================

function normalizePhone(phone) {
  let value = String(phone || "").replace(/\D/g, "");

  if (value.startsWith("0")) {
    value = "91" + value.substring(1);
  }

  if (value.length === 10) {
    value = "91" + value;
  }

  return value;
}

// ==========================================
// GET LATEST PENDING COD ORDER
// ==========================================

async function getPendingCODOrders(phone) {
  const normalizedPhone = normalizePhone(phone);

  console.log(
    "Searching COD orders for phone:",
    normalizedPhone
  );

  const snapshot = await db
    .collection("codOrders")
    .where("phone", "==", normalizedPhone)
    .get();

  console.log(
    "COD orders found:",
    snapshot.size
  );

  const orders = [];

  snapshot.forEach(doc => {
    const data = doc.data();

    console.log("COD order:", {
      id: doc.id,
      orderName: data.orderName,
      phone: data.phone,
      status: data.status
    });

    if (data.status === "pending") {
      orders.push({
        id: doc.id,
        ...data
      });
    }
  });

  orders.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );

  console.log(
    "Pending COD orders:",
    orders.map(order => order.orderName)
  );

  return orders;
}

async function getPendingCODOrder(phone, orderNumber) {
  const orders = await getPendingCODOrders(phone);

  if (!orders.length) {
    return null;
  }

  if (!orderNumber) {
    return orders.length === 1 ? orders[0] : null;
  }

  return orders.find(order => {
    const storedOrderNumber = String(order.orderNumber || "");
    const storedOrderName = String(order.orderName || "").replace(/^#/, "");

    return (
      storedOrderNumber === String(orderNumber) ||
      storedOrderName === String(orderNumber)
    );
  }) || null;
}

function pendingOrderOptions(orders) {
  return orders
    .map(order => {
      const orderNumber = String(
        order.orderNumber || order.orderName || order.id
      ).replace(/^#/, "");

      return `YES ${orderNumber}\nNO ${orderNumber}`;
    })
    .join("\n\n");
}

// ==========================================
// CONFIRM COD ORDER
// ==========================================

async function confirmCODOrder(phone, orderNumber) {
  const order = await getPendingCODOrder(phone, orderNumber);

  if (!order) {
    console.log("No pending COD order for:", phone);
    return;
  }

  // Firestore update
  await db.collection("codOrders").doc(order.id).update({
    status: "confirmed",
    response: "YES",
    respondedAt: new Date().toISOString()
  });

  console.log(
    `COD order confirmed: ${order.orderName}`
  );

  // Shopify tag
  try {
    await addOrderTag(
      order.shopifyOrderId,
      "COD Confirmed"
    );
  } catch (error) {
    console.error(
      "Shopify COD Confirmed tag error:",
      error.message
    );
  }

  // Customer confirmation
  await safeSend(
    phone,
    `Thank you! 🙏\n\nYour Daivik Vastram COD order ${order.orderName} has been confirmed successfully.\n\nWe will dispatch your order shortly. 📦❤️`
  );
}

// ==========================================
// CANCEL COD ORDER
// ==========================================

async function cancelCODOrder(phone, orderNumber) {
  const order = await getPendingCODOrder(phone, orderNumber);

  if (!order) {
    console.log("No pending COD order for:", phone);
    return;
  }

  await db.collection("codOrders").doc(order.id).update({
    status: "cancel_requested",
    response: "NO",
    respondedAt: new Date().toISOString()
  });

  console.log(
    `COD cancellation requested: ${order.orderName}`
  );

  // Shopify tag
  try {
    await addOrderTag(
      order.shopifyOrderId,
      "COD Cancel Requested"
    );
  } catch (error) {
    console.error(
      "Shopify cancellation tag error:",
      error.message
    );
  }

  await safeSend(
    phone,
    `We have received your cancellation request for order ${order.orderName}. 🙏\n\nOur team will process it shortly.`
  );
}

// ==========================================
// HANDLE INCOMING MESSAGE
// ==========================================

async function handleIncomingMessage(message) {
  const phone = message.from;
  const type = message.type;

  console.log("Incoming WhatsApp message:", {
    phone,
    type,
    id: message.id
  });

  // ==========================================
  // TEXT
  // ==========================================

  if (type === "text") {
    const text = (message.text?.body || "")
      .trim()
      .toUpperCase();

    console.log("Customer text:", text);

    const confirmMatch = text.match(/^(YES|CONFIRM)(?:\s*#?(\d+))?$/);

    if (confirmMatch) {
      if (!confirmMatch[2]) {
        const orders = await getPendingCODOrders(phone);

        if (orders.length > 1) {
          await safeSend(
            phone,
            `We found multiple pending COD orders on this number. 🙏\n\nPlease reply for the order you want to confirm:\n\n${pendingOrderOptions(orders)}`
          );
          return;
        }
      }

      await confirmCODOrder(phone, confirmMatch[2]);
      return;
    }

    const cancelMatch = text.match(/^(NO|CANCEL)(?:\s*#?(\d+))?$/);

    if (cancelMatch) {
      if (!cancelMatch[2]) {
        const orders = await getPendingCODOrders(phone);

        if (orders.length > 1) {
          await safeSend(
            phone,
            `We found multiple pending COD orders on this number. 🙏\n\nPlease reply for the order you want to cancel:\n\n${pendingOrderOptions(orders)}`
          );
          return;
        }
      }

      await cancelCODOrder(phone, cancelMatch[2]);
      return;
    }

    // IMPORTANT:
    // Normal messages are completely ignored.
    console.log(
      "Ignoring normal WhatsApp message:",
      text
    );

    return;
  }


  // ==========================================
// TEMPLATE QUICK REPLY BUTTON
// ==========================================

if (type === "button") {
  const buttonText =
    (message.button?.text || "")
      .trim()
      .toUpperCase();

  const buttonPayload =
    (message.button?.payload || "")
      .trim()
      .toUpperCase();

  console.log("Template button reply:", {
    buttonText,
    buttonPayload
  });

  if (
    buttonText.includes("CONFIRM") ||
    buttonPayload.includes("CONFIRM")
  ) {
    await confirmCODOrder(phone);
    return;
  }

  if (
    buttonText.includes("CANCEL") ||
    buttonPayload.includes("CANCEL")
  ) {
    await cancelCODOrder(phone);
    return;
  }

  return;
}

  // ==========================================
  // INTERACTIVE BUTTON
  // ==========================================

  if (type === "interactive") {
    const reply = message.interactive?.button_reply;

    const id = (reply?.id || "").toUpperCase();
    const title = (reply?.title || "").toUpperCase();

    console.log("Interactive reply:", {
      id,
      title
    });

    // YES BUTTON
    if (
      id === "COD_CONFIRM" ||
      title.includes("CONFIRM")
    ) {
      await confirmCODOrder(phone);
      return;
    }

    // NO BUTTON
    if (
      id === "COD_CANCEL" ||
      title.includes("CANCEL")
    ) {
      await cancelCODOrder(phone);
      return;
    }

    return;
  }
}

// ==========================================
// SAFE SEND
// ==========================================

async function safeSend(phone, message) {
  try {
    await sendTextMessage(phone, message);
  } catch (error) {
    console.error(
      "WhatsApp send error:",
      error.response?.data || error.message
    );
  }
}

// ==========================================
// STATUS UPDATE
// ==========================================

function handleStatusUpdate(status) {
  console.log("WhatsApp status:", {
    id: status.id,
    status: status.status,
    recipient: status.recipient_id,
    timestamp: status.timestamp,
    errors: status.errors || []
  });
}

module.exports = {
  sendTextMessage,
  sendTemplateMessage,
  handleIncomingMessage,
  handleStatusUpdate
};