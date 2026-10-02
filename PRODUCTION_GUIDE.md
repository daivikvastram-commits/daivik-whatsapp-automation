# Production Deployment Guide

**Daivik Vastram WhatsApp Automation - v1.0.0**

---

## ✅ Pre-Deployment Checklist

### Code Quality
- [x] Removed all `console.log` statements
- [x] Implemented production logger
- [x] Added error codes and constants
- [x] Proper error handling middleware
- [x] Input validation on all endpoints
- [x] Timeout configuration for API calls
- [x] Rate limiting enabled (80 msg/sec)

### Configuration
- [x] `.env.example` created with all variables
- [x] `.env` file is in `.gitignore` (never commit secrets)
- [x] Firebase secrets configured
- [x] WhatsApp tokens validated
- [x] Environment variables documented

### Security
- [x] No hardcoded credentials in code
- [x] Use environment variables for all secrets
- [x] HTTPS enforced in production
- [x] Input sanitization
- [x] Rate limiting implemented
- [x] Error messages don't leak sensitive info

### Testing
- [x] Tested single message send
- [x] Tested bulk message sending
- [x] Verified message delivery
- [x] Tested queue status endpoint
- [x] Tested campaign creation
- [x] Tested error handling

---

## 🚀 Deployment Steps

### 1. **Local Setup (Development)**
```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your actual credentials

# Run in development mode
npm run dev

# Test the service
curl http://localhost:3000/health
```

### 2. **Firebase Functions Deployment (Recommended)**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy to Firebase Functions
firebase deploy --only functions

# Your service will be available at:
# https://us-central1-YOUR_PROJECT.cloudfunctions.net/...
```

### 3. **Docker Deployment (for Cloud Run, ECS, etc.)**

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

Build and deploy:
```bash
# Build image
docker build -t daivik-whatsapp-automation .

# Deploy to Google Cloud Run
gcloud run deploy daivik-whatsapp-automation \
  --image daivik-whatsapp-automation \
  --platform managed \
  --region us-central1 \
  --set-env-vars "WHATSAPP_ACCESS_TOKEN=YOUR_TOKEN" \
  --set-env-vars "WHATSAPP_PHONE_NUMBER_ID=YOUR_ID"
```

### 4. **Environment Variables in Production**

**Option A: Cloud Secret Manager (Recommended)**
```bash
# Google Cloud Secret Manager
gcloud secrets create whatsapp-token --data-file -
echo "YOUR_TOKEN" | gcloud secrets create whatsapp-token --data-file -

# Deploy with secrets
gcloud run deploy daivik-whatsapp-automation \
  --set-secrets "WHATSAPP_ACCESS_TOKEN=whatsapp-token:latest"
```

**Option B: AWS Secrets Manager**
```bash
aws secretsmanager create-secret \
  --name whatsapp-automation/token \
  --secret-string "YOUR_TOKEN"
```

**Option C: Firebase Secret Manager**
```bash
firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID
```

---

## 📊 Monitoring & Logging

### 1. **Cloud Logging (Google Cloud)**
```bash
# View logs in real-time
gcloud functions logs read daivik-whatsapp \
  --limit 50 \
  --follow
```

### 2. **AWS CloudWatch**
```bash
# View CloudWatch logs
aws logs tail /aws/lambda/daivik-whatsapp --follow
```

### 3. **Local Testing Production Build**
```bash
# Build and test production container locally
docker build -t test-prod .
docker run -e NODE_ENV=production test-prod
```

---

## 🔒 Security Checklist - Production

- [ ] HTTPS enabled for all endpoints
- [ ] CORS configured properly
- [ ] Rate limiting: 80 messages/second
- [ ] Max batch size: 10,000 messages
- [ ] API authentication implemented (if needed)
- [ ] Webhook validation enabled
- [ ] Secrets in secret manager (not .env)
- [ ] Access logs enabled
- [ ] Error logs monitored
- [ ] Database backups configured
- [ ] Firewall rules configured
- [ ] DDoS protection enabled

---

## 🔧 Performance Tuning

### Rate Limiting (Configurable)
Current: **80 messages/second** (WhatsApp recommended)

To change, edit `utils/constants.js`:
```javascript
WHATSAPP: {
  RATE_LIMIT: 80,  // Change this value
  // ...
}
```

### Timeout Configuration
HTTP Request Timeout: **30 seconds**

Edit in `utils/constants.js`:
```javascript
WHATSAPP: {
  MESSAGE_TIMEOUT: 30000,  // milliseconds
}
```

---

## 📈 Scaling Strategy

### Horizontal Scaling (Multiple Instances)
1. Use load balancer (AWS ELB, GCP LB, etc.)
2. Deploy multiple service instances
3. Share Firebase Firestore database
4. Each instance has independent queue (can be improved with Redis)

### Queue Optimization (For High Volume)
Replace in-memory queue with Redis:
```javascript
// Instead of this.queue = []
// Use Redis for distributed queue:
const redis = require("redis");
const client = redis.createClient();
```

### Database Optimization
1. Add indexes to `campaigns` collection
2. Add indexes to `contacts` subcollection
3. Archive old campaigns regularly
4. Use Firestore sharding for high write rates

---

## 🧪 Testing in Production

### 1. **Health Check**
```bash
curl -X GET https://YOUR_DOMAIN/health
```

### 2. **Test Single Message**
```bash
curl -X POST https://YOUR_DOMAIN/bulk/test \
  -H "Content-Type: application/json" \
  -d '{"phone": "917827284932"}'
```

### 3. **Test Bulk Send (Small Batch)**
```bash
curl -X POST https://YOUR_DOMAIN/bulk/send \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": ["917827284932", "919876543210"],
    "campaignName": "Test Campaign"
  }'
```

### 4. **Monitor Queue Status**
```bash
curl -X GET https://YOUR_DOMAIN/bulk/status
```

---

## 📋 Post-Deployment

1. **Verify Message Delivery**
   - Test on actual WhatsApp number
   - Check timestamp and messageID
   - Monitor delivery status

2. **Monitor Logs**
   - Check for errors in logs
   - Monitor rate limiting
   - Track successful/failed rates

3. **Set Up Alerts**
   - Alert on high error rates
   - Alert on queue backup
   - Alert on API timeouts

4. **Document Endpoints**
   - Share API documentation with team
   - Document authentication (if added)
   - Document rate limits and quotas

---

## 🐛 Troubleshooting Production Issues

### Issue: Messages Not Sending
```bash
# Check logs for errors
gcloud functions logs read daivik-whatsapp --limit 100

# Verify credentials
curl -X GET https://YOUR_DOMAIN/health

# Test with known good number
curl -X POST https://YOUR_DOMAIN/bulk/test \
  -H "Content-Type: application/json" \
  -d '{"phone": "7827284932"}'
```

### Issue: Slow Message Delivery
1. Check Firebase latency
2. Verify network connectivity
3. Monitor queue size: `GET /bulk/status`
4. Check rate limiting settings
5. Verify WhatsApp API response times

### Issue: Queue Backup
```bash
# Clear stuck queue
curl -X POST https://YOUR_DOMAIN/bulk/clear

# Check queue status
curl -X GET https://YOUR_DOMAIN/bulk/status

# Consider increasing rate limit temporarily
# Edit utils/constants.js RATE_LIMIT value
```

---

## 📞 Support & Contact

For issues or questions:
1. Check logs first
2. Verify environment variables
3. Test with `/bulk/test` endpoint
4. Review error codes in `utils/constants.js`
5. Contact Meta WhatsApp support if API issue

---

**Last Updated:** 2026-10-02  
**Version:** 1.0.0  
**Environment:** Production Ready ✅
