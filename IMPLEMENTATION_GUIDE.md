# 🚀 Bulk WhatsApp Message Sender Implementation

## 📋 Overview

This is a production-ready **Bulk WhatsApp Message Sender** for the Daivik Vastram WhatsApp Automation project. It enables sending thousands of personalized messages using the WhatsApp Meta Cloud API with the **mata_rani_new_collections** template.

### ✨ Key Features

- ✅ **Queue Management** - Handle large batches with automatic queuing
- ✅ **Rate Limiting** - Respects WhatsApp API limits (80 msg/sec default)
- ✅ **Campaign Tracking** - Store and monitor campaigns in Firebase
- ✅ **Personalization** - Support for dynamic template parameters
- ✅ **Error Handling** - Comprehensive error logging and retry logic
- ✅ **Phone Normalization** - Automatic format validation
- ✅ **REST API** - Clean, documented endpoints
- ✅ **Firebase Integration** - Persistent storage of campaigns

---

## 📁 Project Structure

```
daivik-whatsapp-automation/
├── services/
│   ├── bulkWhatsappService.js         # ⭐ Core bulk sender service
│   └── whatsappService.js             # Existing WhatsApp service
├── controllers/
│   ├── bulkWhatsappController.js      # ⭐ Request handlers
│   └── whatsappController.js          # Existing webhook handlers
├── routes/
│   ├── bulk.js                        # ⭐ Bulk WhatsApp routes
│   ├── whatsapp.js                    # Existing webhook routes
│   └── shopify.js                     # Shopify integration
├── utils/
│   ├── bulkWhatsappValidator.js       # ⭐ Validation utilities
│   └── phone.js                       # Phone utilities
├── examples/
│   ├── bulkWhatsappExamples.js        # ⭐ Node.js usage examples
│   ├── curl_commands.sh               # ⭐ cURL command reference
│   └── Bulk_WhatsApp_API.postman_collection.json  # ⭐ Postman collection
├── BULK_WHATSAPP_API.md               # ⭐ Comprehensive API docs
├── server.js                          # ⭐ Updated with bulk routes
├── package.json
├── .env
└── README.md
```

---

## 🎯 Quick Start

### 1. **Install & Setup**

```bash
# Install dependencies
npm install

# Configure environment variables
# Ensure .env has:
# - WHATSAPP_ACCESS_TOKEN
# - WHATSAPP_PHONE_NUMBER_ID
# - MATA_RANI_IMAGE_URL (optional)
```

### 2. **Start Server**

```bash
npm start
# or for development
npm run dev
```

### 3. **Test the API**

```bash
# Health check
curl http://localhost:3000/health

# Test single message
curl -X POST http://localhost:3000/bulk/test \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "bodyParams": []}'
```

---

## 📚 Usage Examples

### Example 1: Simple Bulk Send

```bash
curl -X POST http://localhost:3000/bulk/send \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      "9876543210",
      "9876543211",
      "9876543212"
    ],
    "campaignName": "Mata Rani Launch"
  }'
```

### Example 2: Personalized Messages

```bash
curl -X POST http://localhost:3000/bulk/send \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      {
        "phone": "9876543210",
        "bodyParams": ["Alice", "15% OFF"]
      },
      {
        "phone": "9876543211",
        "bodyParams": ["Bob", "20% OFF"]
      }
    ],
    "campaignName": "Personalized Discount"
  }'
```

### Example 3: Create & Send Campaign

```bash
# Create campaign
CAMPAIGN_ID=$(curl -s -X POST http://localhost:3000/bulk/campaign/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Diwali Special",
    "contacts": [
      { "phone": "9876543210" },
      { "phone": "9876543211" }
    ]
  }' | jq -r '.campaign.campaignId')

# Send campaign
curl -X POST http://localhost:3000/bulk/campaign/$CAMPAIGN_ID/send

# Monitor status
curl http://localhost:3000/bulk/status
```

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **POST** | `/bulk/send` | Send bulk messages immediately |
| **POST** | `/bulk/test` | Test single message |
| **GET** | `/bulk/status` | Get queue status |
| **POST** | `/bulk/clear` | Clear all pending messages |
| **POST** | `/bulk/campaign/create` | Create new campaign |
| **GET** | `/bulk/campaign/:id` | Get campaign details |
| **POST** | `/bulk/campaign/:id/send` | Send campaign |

📖 **Full Documentation:** See [BULK_WHATSAPP_API.md](./BULK_WHATSAPP_API.md)

---

## 🔧 Core Components

### 1. **bulkWhatsappService.js**

Singleton service handling:
- Message sending via WhatsApp API
- Queue management and rate limiting
- Campaign persistence to Firebase
- Phone number normalization

**Key Methods:**
```javascript
addToQueue(phone, bodyParams)           // Add single message
addBatchToQueue(contacts)               // Add multiple messages
processQueue(onProgress)                // Process with rate limiting
saveCampaign(name, contacts, metadata)  // Save to Firebase
sendCampaign(campaignId, onProgress)    // Send saved campaign
```

### 2. **bulkWhatsappController.js**

Express route handlers:
- `sendBulkMessages()` - POST /bulk/send
- `testSend()` - POST /bulk/test
- `getBulkStatus()` - GET /bulk/status
- `createCampaign()` - POST /bulk/campaign/create
- `getCampaign()` - GET /bulk/campaign/:id
- `sendCampaign()` - POST /bulk/campaign/:id/send

### 3. **bulkWhatsappValidator.js**

Validation utilities:
- Phone number validation
- Contact batch validation
- Campaign name validation
- Environment configuration checks

---

## 📊 Template: mata_rani_new_collections

The template supports:

```
Header:
  └─ Image (from MATA_RANI_IMAGE_URL)

Body:
  └─ Customizable text with parameters

Example:
  bodyParams: ["Alice", "15% OFF"]
  → "Hello Alice! Enjoy 15% OFF on Mata Rani New Collection"
```

**Configure in .env:**
```env
MATA_RANI_IMAGE_URL=https://your-cdn.com/mata-rani-image.jpg
```

---

## 🚀 Advanced Usage

### Use in Node.js Code

```javascript
const bulkSender = require('./services/bulkWhatsappService');

// Send single message
const result = await bulkSender.sendMataRaniTemplate('9876543210', []);

// Add to queue
bulkSender.addToQueue('9876543210', ['John', '10%']);

// Process all queued messages
const results = await bulkSender.processQueue((progress) => {
  console.log(`Sent ${progress.sent} of ${progress.total}`);
});

// Create campaign
const campaign = await bulkSender.saveCampaign(
  'My Campaign',
  ['9876543210', '9876543211'],
  { metadata: 'value' }
);
```

### Monitor Progress

```javascript
const results = await bulkSender.processQueue((progress) => {
  console.log(`Progress: ${progress.processed}/${progress.total}`);
  console.log(`Sent: ${progress.sent}, Failed: ${progress.failed}`);
});
```

---

## ⚙️ Configuration

### Environment Variables

```env
# WhatsApp API Credentials
WHATSAPP_ACCESS_TOKEN=your_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_id_here

# API Configuration
META_GRAPH_API_VERSION=v23.0

# Template Image
MATA_RANI_IMAGE_URL=https://example.com/image.jpg

# Firebase (auto-initialized)
# Uses default GCP_PROJECT or whatsapp-automation-1efb0
```

### Rate Limiting

**Default:** 80 messages/second

**Modify in bulkWhatsappService.js:**
```javascript
this.rateLimit = 80;  // Change this value
this.processingDelay = 1000 / this.rateLimit;
```

---

## 🗄️ Firebase Storage

### Campaigns Collection

```json
{
  "campaigns": {
    "campaign_id": {
      "name": "Campaign Name",
      "totalContacts": 100,
      "status": "completed",
      "metadata": {},
      "createdAt": "2026-10-02T...",
      "startedAt": "2026-10-02T...",
      "completedAt": "2026-10-02T...",
      "results": {
        "sent": 98,
        "failed": 2,
        "total": 100,
        "details": []
      },
      "contacts": {
        "contact_id": {
          "phone": "919876543210",
          "bodyParams": ["Name", "Discount"],
          "status": "sent",
          "createdAt": "2026-10-02T..."
        }
      }
    }
  }
}
```

---

## 🔍 Monitoring & Debugging

### Check Queue Status

```bash
curl http://localhost:3000/bulk/status
```

### View Campaign Results

```bash
curl http://localhost:3000/bulk/campaign/campaign_id
```

### Monitor in Real-time

```bash
# Bash - continuous monitoring
watch -n 1 'curl -s http://localhost:3000/bulk/status | jq .'

# Or in Node.js
setInterval(async () => {
  const status = await axios.get('http://localhost:3000/bulk/status');
  console.log(status.data);
}, 2000);
```

### View Logs

```bash
# The service logs all operations to console:
✓ Message sent to 919876543210: wamid.xxxxx
✗ Failed to send to 919876543211: Error message
📤 Starting bulk send: 100 messages
✅ Bulk send completed!
   Sent: 98 | Failed: 2 | Total: 100
```

---

## ⚠️ Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `WHATSAPP_ACCESS_TOKEN is missing` | Token not configured | Add to `.env` |
| `Invalid phone number` | Wrong format | Use 10 or 12 digits |
| `Campaign not found` | Invalid ID | Check campaign ID |
| `Campaign already completed` | Can't re-send | Create new campaign |
| `contacts array is required` | No contacts provided | Provide contacts array |

### Error Response Format

```json
{
  "error": "Error message description"
}
```

---

## 🧪 Testing

### Using cURL

See `examples/curl_commands.sh` for ready-to-use commands.

### Using Node.js

```bash
node examples/bulkWhatsappExamples.js
```

### Using Postman

Import `examples/Bulk_WhatsApp_API.postman_collection.json` in Postman.

---

## 📈 Performance

- **Queue Size:** Unlimited
- **Batch Limit:** 10,000 contacts per send
- **Rate:** 80 messages/second (configurable)
- **Throughput:** ~4,800 messages/minute
- **Memory:** Efficient queue management

### Estimated Times

- 100 messages: ~1.25 seconds
- 1,000 messages: ~12.5 seconds
- 10,000 messages: ~2 minutes

---

## 🔐 Security Considerations

1. **Never commit .env** - Use `.env.example` for reference
2. **Rotate tokens regularly** - Update WHATSAPP_ACCESS_TOKEN
3. **Validate input** - All inputs are validated
4. **Rate limiting** - Built-in to prevent abuse
5. **Firebase rules** - Secure your Firestore access

---

## 📝 Files Reference

| File | Purpose |
|------|---------|
| `services/bulkWhatsappService.js` | Core service logic |
| `controllers/bulkWhatsappController.js` | Request handlers |
| `routes/bulk.js` | API routes |
| `utils/bulkWhatsappValidator.js` | Validation |
| `BULK_WHATSAPP_API.md` | Full API documentation |
| `examples/bulkWhatsappExamples.js` | Code examples |
| `examples/curl_commands.sh` | cURL commands |
| `examples/Bulk_WhatsApp_API.postman_collection.json` | Postman collection |

---

## 🤝 Contributing

To extend this implementation:

1. **Add new template support** - Modify `sendMataRaniTemplate()`
2. **Custom validators** - Add to `bulkWhatsappValidator.js`
3. **Retry logic** - Enhance error handling in service
4. **Analytics** - Store metrics in Firebase

---

## 📞 Support Resources

1. **Documentation:** [BULK_WHATSAPP_API.md](./BULK_WHATSAPP_API.md)
2. **Examples:** `examples/` directory
3. **API Testing:** Import Postman collection
4. **cURL Commands:** `examples/curl_commands.sh`

---

## 📋 Checklist Before Production

- [ ] Test with real phone numbers
- [ ] Verify WhatsApp credentials
- [ ] Set MATA_RANI_IMAGE_URL correctly
- [ ] Configure Firebase Firestore
- [ ] Test rate limiting
- [ ] Monitor error logs
- [ ] Set up backups for campaigns
- [ ] Configure monitoring/alerts

---

## 🎉 You're Ready!

The Bulk WhatsApp Message Sender is now fully implemented and ready to use.

**Start with:**
```bash
npm start
curl -X POST http://localhost:3000/bulk/test \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

**Then explore:**
- API documentation: [BULK_WHATSAPP_API.md](./BULK_WHATSAPP_API.md)
- Code examples: `examples/bulkWhatsappExamples.js`
- Postman collection: `examples/Bulk_WhatsApp_API.postman_collection.json`

---

**Version:** 1.0.0  
**Last Updated:** October 2, 2026  
**Status:** ✅ Production Ready
