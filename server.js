require("dotenv").config();
require("./config/firebase");
const express = require("express");
const logger = require("./utils/logger");
const CONSTANTS = require("./utils/constants");

const whatsappRoutes = require("./routes/whatsapp");
const shopifyRoutes = require("./routes/shopify");
const bulkRoutes = require("./routes/bulk");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "daivik-whatsapp-automation",
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Home page
app.get("/", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Daivik Vastram - WhatsApp Automation</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #25D366; }
        .status { background: #e8f5e9; padding: 15px; border-left: 4px solid #25D366; margin: 20px 0; border-radius: 4px; }
        .endpoints { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
        .endpoint { background: #f9f9f9; padding: 12px; border-left: 3px solid #25D366; border-radius: 4px; }
        .method { font-weight: bold; color: #25D366; }
        .path { font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 3px; }
        footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✅ Daivik Vastram - WhatsApp Automation</h1>
        <p>Server is running successfully in <strong>${NODE_ENV}</strong> mode</p>
        
        <div class="status">
          <strong>📱 System Status:</strong> Operational
          <br/>Environment: ${NODE_ENV}
          <br/>Time: ${new Date().toISOString()}
        </div>

        <h3>📡 API Endpoints</h3>
        <div class="endpoints">
          <div class="endpoint">
            <div class="method">POST</div>
            <div class="path">/bulk/send</div>
            <div>Send bulk messages</div>
          </div>
          <div class="endpoint">
            <div class="method">GET</div>
            <div class="path">/bulk/status</div>
            <div>Get queue status</div>
          </div>
          <div class="endpoint">
            <div class="method">POST</div>
            <div class="path">/bulk/test</div>
            <div>Test single message</div>
          </div>
          <div class="endpoint">
            <div class="method">POST</div>
            <div class="path">/bulk/clear</div>
            <div>Clear queue</div>
          </div>
          <div class="endpoint">
            <div class="method">POST</div>
            <div class="path">/bulk/campaign/create</div>
            <div>Create campaign</div>
          </div>
          <div class="endpoint">
            <div class="method">GET</div>
            <div class="path">/bulk/campaign/:id</div>
            <div>Get campaign details</div>
          </div>
          <div class="endpoint">
            <div class="method">POST</div>
            <div class="path">/bulk/campaign/:id/send</div>
            <div>Send campaign</div>
          </div>
          <div class="endpoint">
            <div class="method">GET</div>
            <div class="path">/health</div>
            <div>Health check</div>
          </div>
        </div>

        <footer>
          <strong>Daivik Vastram</strong> | WhatsApp Integration Service | v1.0.0
        </footer>
      </div>
    </body>
    </html>
  `);
});

// Routes
app.use("/webhook", whatsappRoutes);
app.use("/shopify", shopifyRoutes);
app.use("/bulk", bulkRoutes);

// 404 handler
app.use((req, res) => {
  res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    message: err.message,
    stack: NODE_ENV === "development" ? err.stack : undefined
  });

  res.status(err.status || CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: err.message || "Internal server error",
    code: err.code || "INTERNAL_ERROR",
    ...(NODE_ENV === "development" && { stack: err.stack })
  });
});

// Server startup
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info("Server started", {
      port: PORT,
      environment: NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    logger.info("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT signal received: closing HTTP server");
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  });
}

module.exports = app;