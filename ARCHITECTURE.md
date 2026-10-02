# 🏗️ System Architecture - Bulk WhatsApp Sender

## Overall System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                              │
│         (cURL, Postman, Browser, Mobile App)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER                                │
│              (server.js - Port 3000)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              ROUTE HANDLER (routes/bulk.js)                      │
│  Maps: POST, GET requests to controller methods                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          CONTROLLER (controllers/bulkWhatsappController.js)      │
│  • sendBulkMessages()      • getBulkStatus()                     │
│  • testSend()              • clearBulkQueue()                    │
│  • createCampaign()        • getCampaign()                       │
│  • sendCampaign()                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    VALIDATOR       SERVICE          FIREBASE
    (validate)   (process)          (persist)
```

---

## Detailed Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    BULK WHATSAPP SYSTEM                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  API LAYER (routes/bulk.js)                               │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  POST   /bulk/send                                         │  │
│  │  POST   /bulk/test                                         │  │
│  │  GET    /bulk/status                                       │  │
│  │  POST   /bulk/clear                                        │  │
│  │  POST   /bulk/campaign/create                              │  │
│  │  GET    /bulk/campaign/:id                                 │  │
│  │  POST   /bulk/campaign/:id/send                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                           │                                       │
│                           ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  CONTROLLER LAYER                                          │  │
│  │  (controllers/bulkWhatsappController.js)                   │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  • Receives requests                                       │  │
│  │  • Calls validators                                        │  │
│  │  • Calls service methods                                   │  │
│  │  • Returns responses                                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                           │                                       │
│            ┌──────────────┼──────────────┐                       │
│            │              │              │                       │
│            ▼              ▼              ▼                       │
│  ┌─────────────────┐ ┌──────────────┐ ┌─────────────────────┐ │
│  │   VALIDATOR     │ │   SERVICE    │ │   FIREBASE          │ │
│  │   LAYER         │ │   LAYER      │ │   PERSISTENCE       │ │
│  ├─────────────────┤ ├──────────────┤ ├─────────────────────┤ │
│  │ Validate:       │ │ • Queue Mgmt │ │ • Campaigns         │ │
│  │ • Phone numbers │ │ • Processing │ │ • Contacts          │ │
│  │ • Batch size    │ │ • Rate limit │ │ • Results           │ │
│  │ • Campaign name │ │ • Normalize  │ │ • Metadata          │ │
│  │ • Input format  │ │ • Send msgs  │ │                     │ │
│  │ • Environment   │ │ • Error hdlg │ │                     │ │
│  └─────────────────┘ │ • Logging    │ │                     │ │
│                      └──────────────┘ └─────────────────────┘ │
│                           │                     │               │
│                           ▼                     ▼               │
│                  ┌──────────────────────┐  ┌──────────────────┐│
│                  │  WHATSAPP API        │  │  FIRESTORE       ││
│                  │  (axios)             │  │  (firebase-admin)││
│                  │                      │  │                  ││
│                  │  • Send messages     │  │  • Store data    ││
│                  │  • Handle responses  │  │  • Query data    ││
│                  │  • Error handling    │  │  • Update status ││
│                  └──────────────────────┘  └──────────────────┘│
│                           │                     │               │
└───────────────────────────┼─────────────────────┼───────────────┘
                            │                     │
                            ▼                     ▼
                   ┌──────────────────┐  ┌──────────────────┐
                   │  WhatsApp        │  │  Firebase        │
                   │  Cloud API       │  │  Firestore       │
                   │  (Meta/Facebook) │  │                  │
                   └──────────────────┘  └──────────────────┘
```

---

## Data Flow - Send Bulk Messages

```
1. REQUEST
   └─ POST /bulk/send
      └─ Body: { contacts, campaignName, saveCampaign }

2. VALIDATION
   └─ Controller validates:
      ├─ Is contacts array?
      ├─ Is not empty?
      ├─ ≤ 10,000 contacts?
      └─ Returns 400 if invalid

3. QUEUE MANAGEMENT
   └─ Service receives contacts
      └─ For each contact:
         ├─ Normalize phone
         ├─ Add to queue
         └─ Queue: { phone, bodyParams, status, addedAt }

4. CAMPAIGN STORAGE (if requested)
   └─ Firebase saves campaign
      ├─ Campaign document
      └─ Sub-collection: contacts

5. RESPONSE
   └─ 202 Accepted
      ├─ queueSize
      ├─ campaignId (if saved)
      └─ nextAction

6. ASYNC PROCESSING
   └─ Service.processQueue() runs:
      ├─ Loop through queue
      ├─ For each message:
      │  ├─ Send via WhatsApp API
      │  ├─ Rate limit delay (12.5ms)
      │  └─ Log result
      ├─ Save results
      └─ Update Firebase
```

---

## Queue Processing Flow

```
START
  │
  ├─ While queue not empty:
  │   │
  │   ├─ Pop message from queue
  │   │
  │   ├─ Send via WhatsApp API
  │   │  ├─ POST to graph.facebook.com
  │   │  ├─ Handle response
  │   │  └─ Log success/failure
  │   │
  │   ├─ Delay (rate limiting)
  │   │  └─ 1000ms / 80 = 12.5ms
  │   │
  │   └─ Update results counter
  │
  ├─ All processed
  │
  ├─ Save results to Firebase
  │
  └─ Done!
```

---

## Campaign Lifecycle

```
CREATE
  │
  ├─ POST /bulk/campaign/create
  │  ├─ Validate name & contacts
  │  ├─ Create Firebase document
  │  │  ├─ status: "pending"
  │  │  └─ createdAt: timestamp
  │  ├─ Store sub-collection: contacts
  │  └─ Return campaignId

RETRIEVE
  │
  ├─ GET /bulk/campaign/:id
  │  ├─ Fetch from Firebase
  │  ├─ Include contacts
  │  └─ Return campaign details

SEND
  │
  ├─ POST /bulk/campaign/:id/send
  │  ├─ Fetch campaign from Firebase
  │  ├─ Validate not already completed
  │  ├─ Update status: "processing"
  │  ├─ Add all contacts to queue
  │  ├─ Process queue
  │  ├─ Update status: "completed"
  │  ├─ Save results
  │  └─ Return success

TRACK
  │
  └─ GET /bulk/campaign/:id
     ├─ View current status
     ├─ See results
     │  ├─ Sent count
     │  ├─ Failed count
     │  └─ Details for each
     └─ Done!
```

---

## Phone Number Normalization

```
INPUT FORMATS:
├─ 9876543210        ─┐
├─ 09876543210       ─┼─ NORMALIZE ─┐
├─ 919876543210      ─┤              │
├─ +919876543210     ─┘              ▼
└─ (987) 654-3210                 919876543210 ✓

PROCESS:
1. Remove all non-digits
2. If starts with '0': replace with '91'
3. If length = 10: prepend '91'
4. If length = 12: already normalized
5. Validate final format
```

---

## Error Handling Flow

```
TRY
  │
  ├─ Send message
  │  ├─ API call
  │  ├─ Response received
  │  └─ Await result

CATCH
  │
  ├─ Error encountered
  │  ├─ Log error
  │  ├─ Mark as failed
  │  ├─ Save error message
  │  └─ Continue to next
  │
  └─ FINALLY
     └─ Update results
```

---

## Rate Limiting Mechanism

```
RATE LIMIT: 80 messages/second

┌──────────────────────────────────────────┐
│  Time Window: 1000ms                     │
├──────────────────────────────────────────┤
│  Messages allowed: 80                    │
│  Delay per message: 1000ms / 80 = 12.5ms│
└──────────────────────────────────────────┘

EXAMPLE TIMING:
├─ Message 1: T=0ms      │
├─ Message 2: T=12.5ms   │  (80 msg/sec)
├─ Message 3: T=25ms     │
├─ Message 4: T=37.5ms   │
├─ Message 5: T=50ms     │
└─ ...
```

---

## Database Schema (Firestore)

```
campaigns/
├── {campaignId}
│   ├── name: string
│   ├── totalContacts: number
│   ├── status: "pending" | "processing" | "completed"
│   ├── metadata: object {}
│   ├── createdAt: timestamp
│   ├── startedAt: timestamp (optional)
│   ├── completedAt: timestamp (optional)
│   ├── results: {
│   │   sent: number
│   │   failed: number
│   │   total: number
│   │   details: [
│   │       {
│   │           success: boolean
│   │           phone: string
│   │           messageId: string (if success)
│   │           error: string (if failed)
│   │           timestamp: string
│   │       }
│   │   ]
│   │}
│   │
│   └── contacts/ (sub-collection)
│       ├── {contactId}
│       │   ├── phone: string
│       │   ├── bodyParams: string[]
│       │   ├── status: "pending" | "sent" | "failed"
│       │   ├── createdAt: timestamp
│       │   └── error: string (optional)
```

---

## API Response Codes

```
202 ACCEPTED
└─ Request received, processing async

201 CREATED
└─ Resource created (campaign)

200 OK
└─ Success, data returned

400 BAD REQUEST
└─ Invalid input
   ├─ Missing required field
   ├─ Invalid phone format
   ├─ Array too large
   └─ etc.

404 NOT FOUND
└─ Campaign not found

500 INTERNAL SERVER ERROR
└─ Server error
   ├─ Firebase error
   ├─ API error
   └─ etc.
```

---

## Technology Stack

```
FRONTEND / CLIENT
├─ cURL (command line)
├─ Postman (API testing)
├─ Insomnia (REST client)
└─ Any HTTP client

BACKEND
├─ Node.js 22+
├─ Express.js (web framework)
├─ Axios (HTTP client)
└─ dotenv (config)

DATABASE
├─ Firebase Firestore
├─ Firebase Admin SDK
└─ GCP Project

EXTERNAL SERVICES
├─ WhatsApp Cloud API (Meta)
├─ Meta Graph API v23.0
└─ CloudFlare (for image URLs)
```

---

## Deployment Options

```
LOCAL DEVELOPMENT
├─ npm start
└─ http://localhost:3000

CLOUD DEPLOYMENT
├─ Firebase Functions
├─ Google Cloud Run
├─ AWS Lambda
├─ Heroku
└─ Any Node.js hosting
```

---

## Monitoring & Logging

```
CONSOLE LOGS
├─ ✓ Message sent: phone, messageId
├─ ✗ Failed: phone, error
├─ 📤 Starting bulk send: count
├─ ✅ Bulk send completed
│  ├─ Sent: count
│  ├─ Failed: count
│  └─ Total: count
└─ 📋 Campaign status: ...

FIREBASE LOGS
├─ Campaign created
├─ Campaign started
├─ Campaign completed
├─ Results saved
└─ Contact status updated

QUEUE STATUS
├─ Queue size
├─ Is processing
└─ Queue contents
```

---

## Summary

```
CLIENT REQUEST
     │
     ▼
  ROUTE
     │
     ▼
  CONTROLLER (validate)
     │
     ├─► SERVICE (queue)
     │     ├─► WHATSAPP API (send)
     │     └─► FIREBASE (persist)
     │
     └─► RESPONSE (202 Accepted)
```

**Clean, modular, and scalable architecture! ✅**
