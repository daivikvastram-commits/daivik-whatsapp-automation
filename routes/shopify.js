const express = require("express");

const {
  sendTemplateMessage
} = require("../services/whatsappService");

const {
  getFirestore
} = require("firebase-admin/firestore");

const router = express.Router();
const db = getFirestore();

// ==========================================
// STATIC LOGO
// ==========================================

const STATIC_LOGO_URL =
  "https://daivikvastram.com/cdn/shop/files/Fixed_Logo.png?v=1778159991&width=375";

// ==========================================
// SHOPIFY COD WEBHOOK
// ==========================================

router.post("/webhook", async (req, res) => {
  try {
    console.log(
      "===== SHOPIFY WEBHOOK RECEIVED ====="
    );

    const order = req.body;

    const orderName =
      order.name ||
      `#${order.order_number || ""}`;

    const orderNumber = String(
      order.order_number ||
      orderName.replace("#", "")
    ).trim();

    const shopifyOrderId = String(
      order.id || ""
    );

    // ==========================================
    // PAYMENT METHOD
    // ==========================================

    const gateways =
      (order.payment_gateway_names || [])
        .map(g => String(g).toLowerCase());

    const isCOD = gateways.some(g =>
      g.includes("cash on delivery") ||
      g.includes("cash on delivery (cod)") ||
      g === "cod" ||
      g.includes("cash_on_delivery")
    );

    console.log("Order:", orderName);
    console.log("Order Number:", orderNumber);
    console.log(
      "Shopify Order ID:",
      shopifyOrderId
    );
    console.log(
      "Payment gateways:",
      order.payment_gateway_names
    );
    console.log("Is COD:", isCOD);

    // ==========================================
    // IGNORE PREPAID
    // ==========================================

    if (!isCOD) {
      console.log(
        `Skipping non-COD order ${orderName}`
      );

      return res.status(200).json({
        success: true,
        skipped: true,
        reason: "Non-COD order"
      });
    }

    // ==========================================
    // CUSTOMER PHONE
    // ==========================================

    const phone =
      order.shipping_address?.phone ||
      order.customer?.phone ||
      order.billing_address?.phone ||
      order.phone;

    if (!phone) {
      console.log(
        `No customer phone found for ${orderName}`
      );

      return res.status(200).json({
        success: false,
        error: "Customer phone number not found"
      });
    }

    let whatsappPhone =
      String(phone).replace(/\D/g, "");

    if (whatsappPhone.startsWith("0")) {
      whatsappPhone =
        "91" +
        whatsappPhone.substring(1);
    }

    if (whatsappPhone.length === 10) {
      whatsappPhone =
        "91" + whatsappPhone;
    }

    // ==========================================
    // CUSTOMER NAME
    // ==========================================

    const customerName =
      order.customer?.first_name ||
      order.shipping_address?.first_name ||
      "Customer";

    // ==========================================
    // PRODUCT
    // ==========================================

    const firstLineItem =
      order.line_items?.[0];

    const productName =
      firstLineItem?.title ||
      firstLineItem?.name ||
      "Your product";

    // ==========================================
    // STATIC LOGO
    // ==========================================

    const productImageUrl =
      STATIC_LOGO_URL;

    // ==========================================
    // ORDER AMOUNT
    // ==========================================

    const amount =
      order.total_price || "0.00";

    if (!shopifyOrderId) {
      throw new Error(
        "Shopify Order ID missing"
      );
    }

    // ==========================================
    // SAVE FIRESTORE
    // ==========================================

    await db
      .collection("codOrders")
      .doc(shopifyOrderId)
      .set({
        shopifyOrderId,
        orderName,
        orderNumber,
        phone: whatsappPhone,
        customerName,
        productName,
        productImageUrl,
        amount,
        status: "pending",
        createdAt:
          new Date().toISOString()
      });

    console.log(
      `COD order saved: ${orderName}`
    );

    console.log(
      "Using static logo:",
      productImageUrl
    );

    // ==========================================
    // SEND APPROVED TEMPLATE
    // ==========================================

    console.log(
      "Sending COD template to:",
      whatsappPhone
    );

    await sendTemplateMessage(
      whatsappPhone,
      "cod_order_confirmation",
      "en",
      [
        customerName,
        orderName,
        productName,
        amount
      ],
      productImageUrl
    );

    console.log(
      `COD template sent for ${orderName}`
    );

    return res.status(200).json({
      success: true,
      order: orderName,
      phone: whatsappPhone,
      productImage: productImageUrl,
      cod: true
    });

  } catch (error) {
    console.error(
      "Shopify webhook error:",
      error.response?.data ||
      error.message
    );

    return res.status(500).json({
      success: false,
      error:
        error.response?.data ||
        error.message
    });
  }
});

module.exports = router;