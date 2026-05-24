const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Helper to load env variables manually from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join('=').trim();
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const NEXT_API_URL = 'http://localhost:3000/api/telegram';

if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is missing in your .env file.');
  process.exit(1);
}

console.log('🤖 Starting Local Telegram Bot Long-Polling Daemon...');
console.log('📢 Target API route:', NEXT_API_URL);
console.log('🔑 Bot Token:', token.substring(0, 10) + '...' + token.substring(token.length - 5));

let offset = 0;

async function poll() {
  try {
    // 10 second timeout for long polling
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=10`;
    const response = await axios.get(url, { timeout: 15000 });
    
    if (response.data && response.data.ok) {
      const updates = response.data.result;
      
      for (const update of updates) {
        // Increment offset to acknowledge this update and prevent receiving it again
        offset = update.update_id + 1;
        
        console.log(`\n📨 Received update #${update.update_id} from Telegram.`);
        if (update.message) {
          console.log(`👤 From: ${update.message.from?.username || update.message.from?.first_name} (ID: ${update.message.chat?.id})`);
          console.log(`💬 Text: "${update.message.text}"`);
        }
        
        // Forward the update to our Next.js API endpoint
        try {
          console.log(`🔄 Forwarding to Next.js API...`);
          const apiResponse = await axios.post(NEXT_API_URL, update, {
            headers: { 'Content-Type': 'application/json' }
          });
          console.log(`✅ Next.js Response:`, apiResponse.status, apiResponse.data);
        } catch (apiErr) {
          console.error(`❌ Failed to forward to Next.js:`, apiErr.response ? apiErr.response.data : apiErr.message);
          console.log(`💡 Make sure your Next.js server is running (npm run dev) on port 3000!`);
        }
      }
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Normal long-poll timeout, just retry
    } else {
      console.error('❌ Telegram Polling Error:', error.message);
      // Wait a short delay before retrying on network error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Immediately start the next long-polling request
  setImmediate(poll);
}

// Clear any registered webhooks first to ensure getUpdates is allowed
async function init() {
  try {
    console.log('🔄 Cleaning up any old webhook registrations...');
    await axios.get(`https://api.telegram.org/bot${token}/deleteWebhook`);
    console.log('✅ Webhook cleared. Bot is now in getUpdates mode.');
    poll();
  } catch (err) {
    console.error('⚠️ Warning: Failed to delete webhook on startup:', err.message);
    poll();
  }
}

init();
