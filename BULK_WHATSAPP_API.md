# 📱 Bulk WhatsApp Message Sender - API Guide

## Overview

The Bulk WhatsApp Message Sender is a production-ready service for sending WhatsApp messages in bulk using the **mata_rani_new_collections** template. It includes:

- ✅ Queue management with rate limiting
- ✅ Campaign tracking and persistence
- ✅ Error handling and retry logic
- ✅ Firebase integration for campaign storage
- ✅ Phone number normalization
- ✅ Template message support

---

## 🚀 Quick Start

### 1. **Test Single Message** (Verify Setup)

```bash
curl -X POST http://localhost:3000/bulk/test \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "bodyParams": []
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Test message sent successfully",
  "result": {
    "success": true,
    "phone": "919876543210",
    "messageId": "wamid.xxxxx",
    "timestamp": "2026-10-02T10:30:00Z"
  }
}
```

---

## 📤 API Endpoints

### 1. **Send Bulk Messages**

**Endpoint:** `POST /bulk/send`

Send multiple messages immediately or save as campaign.

```bash
curl -X POST http://localhost:3000/bulk/send \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      { "phone": "9876543210", "bodyParams": [] },
      { "phone": "9876543211", "bodyParams": [] },
      { "phone": "9876543212", "bodyParams": [] }
    ],
    "campaignName": "Mata Rani Launch",
    "saveCampaign": true
  }'
```

**Parameters:**
- `contacts` (array, required): List of contacts
  - `phone` (string): Phone number (10 or 12 digits)
  - `bodyParams` (array): Message body parameters
- `campaignName` (string, optional): Name for the campaign
- `saveCampaign` (boolean, optional): Save as campaign in Firebase

**Response:**
```json
{
  "status": "accepted",
  "message": "3 messages queued for sending",
  "queueSize": 3,
  "campaignId": "campaign_xyz123",
  "nextAction": "GET /bulk/status to monitor progress"
}
```

**Features:**
- Maximum 10,000 contacts per batch
- Automatic phone number normalization
- Rate limiting (80 messages/second)
- Asynchronous processing

---

### 2. **Get Queue Status**

**Endpoint:** `GET /bulk/status`

Monitor current queue and processing status.

```bash
curl http://localhost:3000/bulk/status
```

**Response:**
```json
{
  "queueStatus": {
    "queueSize": 5,
    "isProcessing": true,
    "queue": [
      {
        "phone": "919876543213",
        "status": "pending",
        "addedAt": "2026-10-02T10:30:00Z"
      }
    ]
  },
  "serverTime": "2026-10-02T10:30:15Z"
}
```

---

### 3. **Clear Queue**

**Endpoint:** `POST /bulk/clear`

Remove all pending messages from queue.

```bash
curl -X POST http://localhost:3000/bulk/clear
```

**Response:**
```json
{
  "status": "cleared",
  "message": "Cleared 5 messages from queue"
}
```

⚠️ **Warning:** This will cancel all pending messages.

---

### 4. **Create Campaign**

**Endpoint:** `POST /bulk/campaign/create`

Create a campaign without immediately sending.

```bash
curl -X POST http://localhost:3000/bulk/campaign/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Diwali Special - Mata Rani Collection",
    "contacts": [
      { "phone": "9876543210", "bodyParams": [] },
      { "phone": "9876543211", "bodyParams": [] }
    ],
    "metadata": {
      "category": "seasonal",
      "discount": "15%",
      "validUntil": "2026-10-15"
    }
  }'
```

**Parameters:**
- `name` (string, required): Campaign name
- `contacts` (array, required): List of contacts
- `metadata` (object, optional): Additional campaign info

**Response:**
```json
{
  "status": "created",
  "campaign": {
    "campaignId": "campaign_abc123",
    "name": "Diwali Special - Mata Rani Collection",
    "totalContacts": 2,
    "status": "ready"
  }
}
```

---

### 5. **Get Campaign Details**

**Endpoint:** `GET /bulk/campaign/:campaignId`

Retrieve campaign information and contact list.

```bash
curl http://localhost:3000/bulk/campaign/campaign_abc123
```

**Response:**
```json
{
  "campaign": {
    "campaignId": "campaign_abc123",
    "name": "Diwali Special - Mata Rani Collection",
    "totalContacts": 2,
    "contactCount": 2,
    "status": "ready",
    "createdAt": "2026-10-02T10:30:00Z",
    "contacts": [
      {
        "id": "contact_1",
        "phone": "919876543210",
        "status": "pending",
        "createdAt": "2026-10-02T10:30:00Z"
      }
    ],
    "metadata": {
      "category": "seasonal",
      "discount": "15%"
    }
  }
}
```

---

### 6. **Send Campaign**

**Endpoint:** `POST /bulk/campaign/:campaignId/send`

Start sending all messages in a campaign.

```bash
curl -X POST http://localhost:3000/bulk/campaign/campaign_abc123/send
```

**Response:**
```json
{
  "status": "processing",
  "campaignId": "campaign_abc123",
  "results": {
    "sent": 1,
    "failed": 1,
    "total": 2,
    "details": [
      {
        "success": true,
        "phone": "919876543210",
        "messageId": "wamid.xxxxx",
        "timestamp": "2026-10-02T10:30:00Z"
      },
      {
        "success": false,
        "phone": "919876543211",
        "error": "Phone number format invalid",
        "timestamp": "2026-10-02T10:30:01Z"
      }
    ]
  },
  "message": "Campaign is being processed. Check status using campaign ID."
}
```

---

## 📋 Template Configuration

### Mata Rani New Collections Template

The template supports:
- **Header:** Product image (automatically added)
- **Body:** Customizable parameters
- **Footer:** Optional discount/offer info
- **Buttons:** Call-to-action buttons

**Template Name:** `mata_rani_new_collections`

**Environment Variables:**
```env
MATA_RANI_IMAGE_URL=https://res.cloudinary.com/daivik/image/upload/v1/mata-rani-new-collections.jpg
```

---

## 📊 Bulk Send Examples

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
    "campaignName": "Quick Promotion"
  }'
```

### Example 2: Send with Body Parameters

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
    ]
  }'
```

### Example 3: Create & Send Campaign

```bash
# Step 1: Create campaign
CAMPAIGN_ID=$(curl -s -X POST http://localhost:3000/bulk/campaign/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mata Rani Launch",
    "contacts": [
      { "phone": "9876543210" },
      { "phone": "9876543211" }
    ]
  }' | jq -r '.campaign.campaignId')

# Step 2: Send campaign
curl -X POST http://localhost:3000/bulk/campaign/$CAMPAIGN_ID/send
```

---

## ⚙️ Configuration

### Rate Limiting

Default: **80 messages/second** (WhatsApp recommended)

Modify in `bulkWhatsappService.js`:
```javascript
this.rateLimit = 80; // Messages per second
this.processingDelay = 1000 / this.rateLimit; // ~12.5ms between messages
```

### Phone Number Formats Supported

- ✅ 10-digit: `9876543210` → `919876543210`
- ✅ 12-digit: `919876543210` → `919876543210`
- ✅ With prefix `0`: `09876543210` → `919876543210`

---

## 🔒 Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `WHATSAPP_ACCESS_TOKEN is missing` | Token not set | Add to `.env` |
| `WHATSAPP_PHONE_NUMBER_ID is missing` | Phone ID not set | Add to `.env` |
| `Invalid phone number: 123` | Invalid format | Use 10 or 12 digits |
| `Campaign not found` | Invalid campaign ID | Check campaign ID |
| `Campaign already completed` | Can't re-send | Create new campaign |

---

## 📈 Monitoring

### Check Processing Progress

```bash
# Monitor queue in real-time
watch -n 1 'curl -s http://localhost:3000/bulk/status | jq .'
```

### View Campaign Results

```bash
curl http://localhost:3000/bulk/campaign/campaign_abc123 | jq '.campaign.results'
```

---

## 🗄️ Firebase Collections

### Campaigns Collection
```
campaigns/
  ├── campaignId/
  │   ├── name: string
  │   ├── totalContacts: number
  │   ├── status: "pending" | "processing" | "completed"
  │   ├── metadata: object
  │   ├── createdAt: timestamp
  │   ├── startedAt: timestamp
  │   ├── completedAt: timestamp
  │   ├── results: object
  │   └── contacts/ (subcollection)
  │       ├── contactId/
  │       │   ├── phone: string
  │       │   ├── bodyParams: array
  │       │   ├── status: string
  │       │   └── createdAt: timestamp
```

---

## 🚨 Best Practices

1. **Test First**: Always use `/bulk/test` before bulk sending
2. **Small Batches**: Start with <100 contacts to verify
3. **Monitor Queue**: Check `/bulk/status` periodically
4. **Save Campaigns**: Use `saveCampaign: true` for important sends
5. **Rate Limiting**: Respect WhatsApp's API limits
6. **Error Recovery**: Check failed messages in campaign results
7. **Phone Validation**: Ensure valid phone numbers before sending

---

## 📝 Logs

All messages are logged to console:
```
✓ Message sent to 919876543210: wamid.xxxxx
✗ Failed to send to 919876543211: Invalid phone number
📤 Starting bulk send: 100 messages
✅ Bulk send completed!
   Sent: 98 | Failed: 2 | Total: 100
```

---

## 🐛 Troubleshooting

### Messages Not Sending

1. Verify WhatsApp credentials in `.env`
2. Check token hasn't expired
3. Use `/bulk/test` to test setup
4. Check queue status: `GET /bulk/status`
5. Review logs for error messages

### Queue Stuck

```bash
# Clear queue and restart
curl -X POST http://localhost:3000/bulk/clear
```

### Firebase Connection Issues

1. Ensure `firebase.js` is properly configured
2. Check service account credentials
3. Verify Firestore access permissions

---

## 📞 Support

For issues or questions:
1. Check logs in console
2. Verify `.env` configuration
3. Test with `/bulk/test` endpoint
4. Review campaign details at `/bulk/campaign/:id`

---

**Last Updated:** October 2, 2026
**Version:** 1.0.0
