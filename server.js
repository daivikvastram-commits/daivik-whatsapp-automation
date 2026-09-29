require("dotenv").config();
require("./config/firebase");
const express = require("express");
const whatsappRoutes = require("./routes/whatsapp");
const shopifyRoutes = require("./routes/shopify");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send(`
    <h1>Daivik Vastram WhatsApp Automation</h1>
    <p>Server is running successfully.</p>
  `);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "daivik-whatsapp-automation",
    time: new Date().toISOString()
  });
});

// WhatsApp webhook
app.use("/webhook", whatsappRoutes);

// Shopify webhook
app.use("/shopify", shopifyRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;