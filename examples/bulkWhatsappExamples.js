/**
 * Bulk WhatsApp Sender - Usage Examples
 * 
 * This file contains examples of how to use the Bulk WhatsApp Message Sender
 * in different scenarios.
 */

const axios = require("axios");

const BASE_URL = "http://localhost:3000";

// ============================================
// Example 1: Simple Bulk Send
// ============================================
async function example1_SimpleBulkSend() {
  console.log("\n=== Example 1: Simple Bulk Send ===\n");

  try {
    const response = await axios.post(`${BASE_URL}/bulk/send`, {
      contacts: [
        "9876543210",
        "9876543211",
        "9876543212"
      ],
      campaignName: "Quick Promotion - Mata Rani Collection"
    });

    console.log("✅ Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// ============================================
// Example 2: Bulk Send with Parameters
// ============================================
async function example2_BulkSendWithParameters() {
  console.log("\n=== Example 2: Bulk Send with Parameters ===\n");

  try {
    const response = await axios.post(`${BASE_URL}/bulk/send`, {
      contacts: [
        {
          phone: "9876543210",
          bodyParams: ["Priya", "15%"]
        },
        {
          phone: "9876543211",
          bodyParams: ["Anaya", "20%"]
        },
        {
          phone: "9876543212",
          bodyParams: ["Divya", "25%"]
        }
      ],
      campaignName: "Personalized Discount Campaign"
    });

    console.log("✅ Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// ============================================
// Example 3: Test Single Message
// ============================================
async function example3_TestSingleMessage() {
  console.log("\n=== Example 3: Test Single Message ===\n");

  try {
    const response = await axios.post(`${BASE_URL}/bulk/test`, {
      phone: "9876543210",
      bodyParams: []
    });

    console.log("✅ Test Message Sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// ============================================
// Example 4: Create Campaign
// ============================================
async function example4_CreateCampaign() {
  console.log("\n=== Example 4: Create Campaign ===\n");

  try {
    const response = await axios.post(`${BASE_URL}/bulk/campaign/create`, {
      name: "Diwali Special - Mata Rani Collection",
      contacts: [
        { phone: "9876543210", bodyParams: [] },
        { phone: "9876543211", bodyParams: [] },
        { phone: "9876543212", bodyParams: [] }
      ],
      metadata: {
        category: "seasonal",
        discount: "30%",
        validUntil: "2026-10-15",
        target_audience: "previous_customers"
      }
    });

    console.log("✅ Campaign Created:", response.data);
    return response.data.campaign.campaignId;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// ============================================
// Example 5: Get Campaign Details
// ============================================
async function example5_GetCampaignDetails(campaignId) {
  console.log("\n=== Example 5: Get Campaign Details ===\n");

  try {
    const response = await axios.get(`${BASE_URL}/bulk/campaign/${campaignId}`);

    console.log("✅ Campaign Details:", response.data);
    return response.data.campaign;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// ============================================
// Example 6: Send Campaign
// ============================================
async function example6_SendCampaign(campaignId) {
  console.log("\n=== Example 6: Send Campaign ===\n");

  try {
    const response = await axios.post(`${BASE_URL}/bulk/campaign/${campaignId}/send`);

    console.log("✅ Campaign Sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// ============================================
// Example 7: Monitor Queue Status
// ============================================
async function example7_MonitorQueueStatus() {
  console.log("\n=== Example 7: Monitor Queue Status ===\n");

  try {
    const response = await axios.get(`${BASE_URL}/bulk/status`);

    console.log("✅ Queue Status:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// ============================================
// Example 8: Polling for Completion
// ============================================
async function example8_PollForCompletion() {
  console.log("\n=== Example 8: Poll Until Queue Empty ===\n");

  const startTime = Date.now();
  const maxWaitTime = 5 * 60 * 1000; // 5 minutes

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await axios.get(`${BASE_URL}/bulk/status`);
      const { queueSize, isProcessing } = response.data.queueStatus;

      console.log(`Queue Size: ${queueSize} | Processing: ${isProcessing}`);

      if (queueSize === 0 && !isProcessing) {
        console.log("✅ All messages processed!");
        break;
      }

      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  }
}

// ============================================
// Example 9: Bulk Send from CSV Data
// ============================================
async function example9_BulkSendFromData() {
  console.log("\n=== Example 9: Bulk Send with Mixed Data ===\n");

  // Simulated data from CSV or database
  const customersData = [
    { phone: "9876543210", name: "Alice Kumar", discount: "10%" },
    { phone: "9876543211", name: "Bob Singh", discount: "15%" },
    { phone: "9876543212", name: "Carol Sharma", discount: "20%" },
    { phone: "9876543213", name: "Diana Patel", discount: "25%" }
  ];

  try {
    // Transform data for API
    const contacts = customersData.map(customer => ({
      phone: customer.phone,
      bodyParams: [customer.name, customer.discount]
    }));

    const response = await axios.post(`${BASE_URL}/bulk/send`, {
      contacts,
      campaignName: `Bulk Campaign - ${new Date().toISOString().split('T')[0]}`,
      saveCampaign: true
    });

    console.log("✅ Bulk Send Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// ============================================
// Example 10: Complete Workflow
// ============================================
async function example10_CompleteWorkflow() {
  console.log("\n=== Example 10: Complete Workflow ===\n");

  try {
    // Step 1: Create campaign
    console.log("📝 Step 1: Creating campaign...");
    const campaignResponse = await axios.post(`${BASE_URL}/bulk/campaign/create`, {
      name: "Complete Workflow Example",
      contacts: [
        { phone: "9876543210", bodyParams: [] },
        { phone: "9876543211", bodyParams: [] }
      ],
      metadata: {
        example: true,
        timestamp: new Date().toISOString()
      }
    });

    const campaignId = campaignResponse.data.campaign.campaignId;
    console.log(`✅ Campaign created: ${campaignId}`);

    // Step 2: Get campaign details
    console.log("\n📋 Step 2: Getting campaign details...");
    const detailsResponse = await axios.get(`${BASE_URL}/bulk/campaign/${campaignId}`);
    console.log(`✅ Campaign has ${detailsResponse.data.campaign.contactCount} contacts`);

    // Step 3: Send campaign
    console.log("\n📤 Step 3: Sending campaign...");
    const sendResponse = await axios.post(`${BASE_URL}/bulk/campaign/${campaignId}/send`);
    console.log("✅ Campaign send initiated");

    // Step 4: Monitor progress
    console.log("\n📊 Step 4: Monitoring progress...");
    let checkCount = 0;
    while (checkCount < 12) {
      const statusResponse = await axios.get(`${BASE_URL}/bulk/status`);
      const { queueSize } = statusResponse.data.queueStatus;
      console.log(`   Queue size: ${queueSize}`);

      if (queueSize === 0) break;

      await new Promise(resolve => setTimeout(resolve, 1000));
      checkCount++;
    }

    console.log("\n✅ Workflow completed!");
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// ============================================
// Run Examples
// ============================================
async function runAllExamples() {
  console.log("🚀 Bulk WhatsApp Sender - Examples\n");

  // Test connection first
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log("✅ Server is running\n");
  } catch (error) {
    console.error("❌ Server is not running. Start it with: npm start");
    return;
  }

  // Run examples
  try {
    // Example 3: Test (always safe)
    await example3_TestSingleMessage();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Example 1: Simple send
    // await example1_SimpleBulkSend();

    // Example 4: Create campaign
    // const campaignId = await example4_CreateCampaign();

    // Example 5: Get details
    // if (campaignId) {
    //   await example5_GetCampaignDetails(campaignId);
    // }

    // Example 7: Check status
    await example7_MonitorQueueStatus();

    console.log("\n✅ Examples completed!");
  } catch (error) {
    console.error("❌ Error running examples:", error.message);
  }
}

// Export for use in other files
module.exports = {
  example1_SimpleBulkSend,
  example2_BulkSendWithParameters,
  example3_TestSingleMessage,
  example4_CreateCampaign,
  example5_GetCampaignDetails,
  example6_SendCampaign,
  example7_MonitorQueueStatus,
  example8_PollForCompletion,
  example9_BulkSendFromData,
  example10_CompleteWorkflow,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
