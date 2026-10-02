# 🚀 Bulk WhatsApp Sender - Quick Start Guide

## What You Got

A complete, production-ready system to send **bulk WhatsApp messages** using the **mata_rani_new_collections** template.

---

## 5-Minute Setup

### 1. Start the Server
```bash
npm start
```
✅ Server running on `http://localhost:3000`

### 2. Test It Works
```bash
curl -X POST http://localhost:3000/bulk/test \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "bodyParams": []}'
```
✅ You should get a success response

### 3. Send Bulk Messages
```bash
curl -X POST http://localhost:3000/bulk/send \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      "9876543210",
      "9876543211",
      "9876543212"
    ],
    "campaignName": "My First Campaign"
  }'
```
✅ Messages queued and will be sent!

### 4. Check Status
```bash
curl http://localhost:3000/bulk/status
```
✅ See how many messages are queued/sent

---

## 📱 Common Use Cases

### Send to 100 Customers
```bash
curl -X POST http://localhost:3000/bulk/send \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      "9876543210",
      "9876543211",
      "9876543212"
      // ... more phone numbers
    ],
    "campaignName": "Diwali Sale 2026"
  }'
```

### Send Personalized Messages
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
    "campaignName": "VIP Discount"
  }'
```

### Create Campaign First, Send Later
```bash
# Step 1: Create
curl -X POST http://localhost:3000/bulk/campaign/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Christmas Special",
    "contacts": ["9876543210", "9876543211"]
  }'
# Returns: campaign_id

# Step 2: Send (anytime)
curl -X POST http://localhost:3000/bulk/campaign/{campaign_id}/send
```

---

## 📊 What You Need to Know

### Phone Numbers
All formats work - they're auto-converted:
- `9876543210` ✅
- `919876543210` ✅
- `09876543210` ✅

### Message Sending
- Sent **asynchronously** (doesn't block)
- **80 messages per second** (WhatsApp safe)
- Messages go to queue instantly
- Processing happens in background

### Campaign Tracking
- Saves to **Firebase**
- Track results later
- See success/failure stats

### Response Codes
- `202` = Accepted (processing)
- `201` = Created (campaign saved)
- `200` = Success
- `400` = Bad request (check data)
- `500` = Server error

---

## 🎯 All Available API Endpoints

```
POST   /bulk/send                    → Send bulk messages
POST   /bulk/test                    → Test single message  
GET    /bulk/status                  → Check queue status
POST   /bulk/clear                   → Clear queue ⚠️

POST   /bulk/campaign/create         → Create campaign
GET    /bulk/campaign/{id}           → Get campaign info
POST   /bulk/campaign/{id}/send      → Send campaign
```

---

## 💡 Pro Tips

1. **Always test first**
   ```bash
   curl -X POST http://localhost:3000/bulk/test \
     -H "Content-Type: application/json" \
     -d '{"phone": "9876543210"}'
   ```

2. **Monitor progress**
   ```bash
   # Watch queue in real-time (requires jq)
   watch -n 1 'curl -s http://localhost:3000/bulk/status | jq .'
   ```

3. **Check campaign results**
   ```bash
   curl http://localhost:3000/bulk/campaign/{campaign_id} | jq '.campaign.results'
   ```

4. **Save important sends**
   ```bash
   "saveCampaign": true    # Store in Firebase
   ```

5. **Use Postman for testing**
   - Import: `examples/Bulk_WhatsApp_API.postman_collection.json`
   - Point to: `http://localhost:3000`
   - Done!

---

## 🔍 Troubleshooting

### Message not sending?
1. Check: `curl http://localhost:3000/health` (should be OK)
2. Test: `curl -X POST http://localhost:3000/bulk/test -H "Content-Type: application/json" -d '{"phone": "9876543210"}'`
3. Review: Check phone number format (10 or 12 digits)

### Queue not processing?
```bash
curl http://localhost:3000/bulk/status
# Check: queueSize, isProcessing
```

### Need to stop everything?
```bash
curl -X POST http://localhost:3000/bulk/clear
# Clears all pending messages
```

---

## 📚 Learn More

| Want to... | See this file |
|-----------|---------------|
| Full API docs | [BULK_WHATSAPP_API.md](./BULK_WHATSAPP_API.md) |
| Implementation details | [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) |
| Code examples | [examples/bulkWhatsappExamples.js](./examples/bulkWhatsappExamples.js) |
| All cURL commands | [examples/curl_commands.sh](./examples/curl_commands.sh) |
| Postman collection | [examples/Bulk_WhatsApp_API.postman_collection.json](./examples/Bulk_WhatsApp_API.postman_collection.json) |

---

## ✅ What's Included

✅ Core service with queue management  
✅ Rate limiting (80 msg/sec)  
✅ Firebase integration  
✅ Phone validation  
✅ Error handling  
✅ Campaign tracking  
✅ REST API  
✅ Comprehensive docs  
✅ Code examples  
✅ Postman collection  
✅ cURL commands  

---

## 🎉 Next Steps

1. **Run it:**
   ```bash
   npm start
   ```

2. **Test it:**
   ```bash
   curl -X POST http://localhost:3000/bulk/test \
     -H "Content-Type: application/json" \
     -d '{"phone": "YOUR_NUMBER"}'
   ```

3. **Send it:**
   ```bash
   curl -X POST http://localhost:3000/bulk/send \
     -H "Content-Type: application/json" \
     -d '{
       "contacts": ["9876543210", "9876543211"],
       "campaignName": "My Campaign"
     }'
   ```

4. **Track it:**
   ```bash
   curl http://localhost:3000/bulk/status
   ```

---

**That's it! 🚀 You're ready to send bulk WhatsApp messages!**

---

*Last Updated: October 2, 2026*  
*Version: 1.0.0*
