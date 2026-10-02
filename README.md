# Daivik Vastram WhatsApp Automation - Production Ready

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** 2026-10-02

---

## 📖 Overview

A **production-grade WhatsApp bulk message sender** for Daivik Vastram using Meta WhatsApp Cloud API. Send thousands of personalized messages with image templates, manage campaigns, track delivery, and scale with confidence.

### Key Features

✅ **Bulk Messaging** - Send 10,000+ messages in a single request  
✅ **Rate Limiting** - 80 messages/second with intelligent queue  
✅ **Image Templates** - Send Mata Rani collection images  
✅ **Campaign Management** - Create, track, and manage campaigns  
✅ **Persistent Storage** - Firebase Firestore integration  
✅ **Production Logging** - Structured logging with timestamps  
✅ **Error Handling** - Comprehensive error codes and messages  
✅ **Security** - Environment-based secrets management  

---

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start Server
```bash
npm run dev      # Development
npm start        # Production
```

### 4. Test It Works
```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/bulk/test \
  -H "Content-Type: application/json" \
  -d '{"phone": "7827284932"}'
```

---

## 📡 API Quick Reference

**Send Bulk Messages:**
```bash
POST /bulk/send
{"contacts": ["7827284932", "9876543210"], "campaignName": "Test"}
```

**Check Status:**
```bash
GET /bulk/status
```

**Test Single Message:**
```bash
POST /bulk/test
{"phone": "7827284932"}
```

**Create Campaign:**
```bash
POST /bulk/campaign/create
{"name": "Campaign Name", "contacts": [...]}
```

---

## 🏗️ Project Structure

```
├── server.js                    # Express entry point
├── config/firebase.js           # Firebase setup
├── services/bulkWhatsappService.js   # Core logic
├── controllers/bulkWhatsappController.js # Handlers
├── utils/
│   ├── logger.js               # Logging utility
│   ├── constants.js            # Config & error codes
│   └── phone.js                # Phone utilities
└── .env                        # Configuration (not in git)
```

---

## 🔐 Configuration

**Required Variables:**
- `WHATSAPP_ACCESS_TOKEN` - Meta WhatsApp API token
- `WHATSAPP_PHONE_NUMBER_ID` - Your Business Phone ID
- `MATA_RANI_IMAGE_URL` - Template image URL

See `.env.example` for all options.

---

## ✨ Production Features

- **Professional Logging** - Structured logs with timestamps
- **Error Codes** - Clear error classification
- **Rate Limiting** - 80 messages/second
- **Queue Management** - Non-blocking async processing
- **Security** - Secrets via environment variables
- **Monitoring** - Health check & status endpoints
- **Graceful Shutdown** - SIGTERM/SIGINT handling

---

## 🚢 Deployment

**Firebase Functions:**
```bash
firebase deploy --only functions
```

**Google Cloud Run:**
```bash
gcloud run deploy daivik-whatsapp-automation --source .
```

**Docker:**
```bash
docker build -t daivik-whatsapp .
docker run daivik-whatsapp
```

See `PRODUCTION_GUIDE.md` for detailed instructions.

---

## 📚 Documentation

- **[PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md)** - Deployment & operations
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Features & usage

---

## 🧪 Testing

```bash
npm test              # Run tests (configure as needed)
npm run dev          # Start with live reload
```

---

## ✅ What's Production Ready

- ✅ Zero debug code
- ✅ Professional logging
- ✅ Complete error handling
- ✅ Input validation
- ✅ Security best practices
- ✅ Rate limiting
- ✅ Async processing
- ✅ Firebase integration

---

## 📞 Support

**Test Connectivity:**
```bash
curl http://localhost:3000/health
```

**View Logs:**
```bash
npm run dev          # Development mode shows logs
gcloud functions logs read daivik-whatsapp  # Production
```

**Troubleshoot:**
1. Check environment variables: `echo $WHATSAPP_ACCESS_TOKEN`
2. Test endpoint: `curl http://localhost:3000/health`
3. View logs for errors
4. See `PRODUCTION_GUIDE.md` for solutions

---

## 📄 License

MIT - Use freely and modify as needed.

---

**Version:** 1.0.0 | **Status:** ✅ Production Ready | **Updated:** 2026-10-02

1. Create or select a Firebase project, then install and sign in to the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

2. Create a local `.env` from `config/env.example` and fill in all required values. Do not commit `.env`.

3. Install dependencies and deploy the HTTP function:

```bash
npm install
firebase deploy --only functions
```

The deployed function is named `api`. Set the Meta WhatsApp callback URL to:

```text
https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/api/webhook
```

The verify token in Meta must match `WHATSAPP_VERIFY_TOKEN` in the deployed function environment.

Current project URL:

```text
https://api-bjcd5jjoia-uc.a.run.app
```

## 5. Meta webhook

Meta WhatsApp callback URL:

```text
https://api-bjcd5jjoia-uc.a.run.app/webhook
```

Shopify webhook URL:

```text
https://api-bjcd5jjoia-uc.a.run.app/shopify/webhook
```

Verify token must exactly match:

```text
WHATSAPP_VERIFY_TOKEN
```

## Current features

- Meta webhook verification
- Incoming WhatsApp messages
- Dynamic COD confirmation and cancellation by order number
- Normal WhatsApp messages are ignored
- Shopify order tagging after confirmation or cancellation
- WhatsApp status logging
- WhatsApp text sending helper
- WhatsApp template sending with an image header
- Firestore pending-order tracking
- Health check
