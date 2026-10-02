#!/bin/bash

# ============================================
# Bulk WhatsApp API - cURL Commands
# ============================================
# Copy and paste these commands to test the API
# Make sure the server is running: npm start

BASE_URL="http://localhost:3000"

# ============================================
# 1. HEALTH CHECK
# ============================================
echo "=== 1. Health Check ==="
curl -X GET $BASE_URL/health
echo -e "\n\n"

# ============================================
# 2. TEST SINGLE MESSAGE
# ============================================
echo "=== 2. Test Single Message ==="
curl -X POST $BASE_URL/bulk/test \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "bodyParams": []
  }'
echo -e "\n\n"

# ============================================
# 3. SEND SIMPLE BULK MESSAGES
# ============================================
echo "=== 3. Send Simple Bulk Messages ==="
curl -X POST $BASE_URL/bulk/send \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      "9876543210",
      "9876543211",
      "9876543212"
    ],
    "campaignName": "Quick Launch - Mata Rani Collection"
  }'
echo -e "\n\n"

# ============================================
# 4. SEND BULK WITH PERSONALIZATION
# ============================================
echo "=== 4. Send Bulk with Personalization ==="
curl -X POST $BASE_URL/bulk/send \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      {
        "phone": "9876543210",
        "bodyParams": ["Priya", "15% OFF"]
      },
      {
        "phone": "9876543211",
        "bodyParams": ["Anaya", "20% OFF"]
      },
      {
        "phone": "9876543212",
        "bodyParams": ["Divya", "25% OFF"]
      }
    ],
    "campaignName": "Personalized Discount - Diwali Special",
    "saveCampaign": true
  }'
echo -e "\n\n"

# ============================================
# 5. GET QUEUE STATUS
# ============================================
echo "=== 5. Get Queue Status ==="
curl -X GET $BASE_URL/bulk/status
echo -e "\n\n"

# ============================================
# 6. CREATE CAMPAIGN
# ============================================
echo "=== 6. Create Campaign ==="
curl -X POST $BASE_URL/bulk/campaign/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Diwali Special - Mata Rani New Collection",
    "contacts": [
      { "phone": "9876543210", "bodyParams": [] },
      { "phone": "9876543211", "bodyParams": [] },
      { "phone": "9876543212", "bodyParams": [] }
    ],
    "metadata": {
      "category": "seasonal",
      "discount": "30%",
      "validUntil": "2026-10-15",
      "target": "vip_customers"
    }
  }'
echo -e "\n\n"

# ============================================
# 7. GET CAMPAIGN (Replace CAMPAIGN_ID)
# ============================================
echo "=== 7. Get Campaign Details ==="
echo "Usage: Replace CAMPAIGN_ID with actual ID from step 6"
echo "curl -X GET $BASE_URL/bulk/campaign/CAMPAIGN_ID"
echo -e "\n"

# ============================================
# 8. SEND CAMPAIGN (Replace CAMPAIGN_ID)
# ============================================
echo "=== 8. Send Campaign ==="
echo "Usage: Replace CAMPAIGN_ID with actual ID from step 6"
echo "curl -X POST $BASE_URL/bulk/campaign/CAMPAIGN_ID/send"
echo -e "\n"

# ============================================
# 9. CLEAR QUEUE
# ============================================
echo "=== 9. Clear Queue ==="
echo "⚠️  WARNING: This will delete all pending messages!"
echo "curl -X POST $BASE_URL/bulk/clear"
echo -e "\n"

# ============================================
# MONITORING SCRIPT
# ============================================
# Uncomment below to monitor queue continuously

# echo "=== Monitoring Queue (Press Ctrl+C to stop) ==="
# while true; do
#   clear
#   echo "Queue Status at $(date)"
#   curl -s $BASE_URL/bulk/status | jq '.'
#   sleep 2
# done

# ============================================
# BATCH SEND EXAMPLE
# ============================================
# Replace contacts with your actual data

# CONTACTS='[
#   { "phone": "9876543210", "bodyParams": ["Customer 1", "10%"] },
#   { "phone": "9876543211", "bodyParams": ["Customer 2", "15%"] },
#   { "phone": "9876543212", "bodyParams": ["Customer 3", "20%"] }
# ]'
#
# curl -X POST $BASE_URL/bulk/send \
#   -H "Content-Type: application/json" \
#   -d "{
#     \"contacts\": $CONTACTS,
#     \"campaignName\": \"Batch Send $(date +%Y-%m-%d)\",
#     \"saveCampaign\": true
#   }"

# ============================================
# NOTES
# ============================================
# 1. All phone numbers are auto-normalized
#    - 10 digits: 9876543210 → 919876543210
#    - 12 digits: 919876543210 → 919876543210
#    - With 0: 09876543210 → 919876543210
#
# 2. Default rate: 80 messages/second
#
# 3. Maximum: 10,000 contacts per batch
#
# 4. Template: mata_rani_new_collections
#
# 5. Messages are sent asynchronously (202 Accepted response)
#
# 6. Use GET /bulk/status to monitor progress

echo "✅ Command reference complete!"
echo "📝 Check BULK_WHATSAPP_API.md for detailed documentation"
