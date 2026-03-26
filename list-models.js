const fs = require('fs');
const path = require('path');

function getApiKey() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/GEMINI_API_KEY=(.*)/);
    return match ? match[1].trim() : "";
  } catch (err) {
    return "";
  }
}

async function listModels() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log("No API Key found in .env.local");
    return;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
