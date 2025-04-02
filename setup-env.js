// This script runs during build to inject environment variables into the environment files
// It should be run before Angular's build process

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Define target environment files
const targetFiles = {
  prod: path.join(__dirname, 'apps/craft-web/src/environments/environment.prod.ts'),
  dev: path.join(__dirname, 'apps/craft-web/src/environments/environment.ts'),
};

// Get environment variables
const envVars = {
  FINNHUB_API_KEY: process.env.FINNHUB_API_KEY || '',
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || '',
  FLIGHT_AWARE_USER: process.env.FLIGHT_AWARE_USER || '',
  FLIGHT_AWARE_API_KEY: process.env.FLIGHT_AWARE_API_KEY || '',
  HUGGING_FACE_AFP: process.env.HUGGING_FACE_AFP || '',
  FLIGHT_RADAR24_API_KEY: process.env.FLIGHT_RADAR24_API_KEY || '',
  YAHOO_FINANCE_API_KEY: process.env.YAHOO_FINANCE_API_KEY || '',
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || '',
  DEEPSEEK_ENABLED: process.env.DEEPSEEK_ENABLED === 'true',
  MISTRAL_ENABLED: process.env.MISTRAL_ENABLED === 'true',
  OPENAI_ENABLED: process.env.OPENAI_ENABLED === 'true',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
};

// Process each target file
Object.entries(targetFiles).forEach(([env, filePath]) => {
  console.log(`Processing ${env} environment file at ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace API keys in the file
    content = content.replace(/apiKey: ['"].*?['"](?=,\s*\/\/\s*Injected during CI\/CD)/g, `apiKey: '${envVars.FINNHUB_API_KEY}'`);
    content = content.replace(/accessToken: ['"].*?['"](?=,\s*\/\/\s*Injected during CI\/CD)/g, `accessToken: '${envVars.MAPBOX_ACCESS_TOKEN}'`);
    content = content.replace(/username: ['"].*?['"](?=,\s*\/\/\s*Injected during CI\/CD)/g, `username: '${envVars.FLIGHT_AWARE_USER}'`);
    content = content.replace(/apiKey: ['"].*?['"](?=,\s*\/\/\s*Injected during CI\/CD.*flightAware)/g, `apiKey: '${envVars.FLIGHT_AWARE_API_KEY}'`);
    content = content.replace(/apiKey: ['"].*?['"](?=,\s*\/\/\s*Injected during CI\/CD.*huggingFace)/g, `apiKey: '${envVars.HUGGING_FACE_AFP}'`);
    content = content.replace(/apiKey: ['"].*?['"](?=,\s*\/\/\s*Injected during CI\/CD.*flightRadar24)/g, `apiKey: '${envVars.FLIGHT_RADAR24_API_KEY}'`);
    content = content.replace(/apiKey: ['"].*?['"](?=,\s*\/\/\s*Injected during CI\/CD.*yahooFinance)/g, `apiKey: '${envVars.YAHOO_FINANCE_API_KEY}'`);
    content = content.replace(/alphaVantageApiKey: ['"].*?['"](?=,)/g, `alphaVantageApiKey: '${envVars.ALPHA_VANTAGE_API_KEY}'`);
    
    // Update AI model settings
    content = content.replace(/deepseekEnabled: (?:true|false)/g, `deepseekEnabled: ${envVars.DEEPSEEK_ENABLED}`);
    content = content.replace(/mistralEnabled: (?:true|false)/g, `mistralEnabled: ${envVars.MISTRAL_ENABLED}`);
    content = content.replace(/openaiEnabled: (?:true|false)/g, `openaiEnabled: ${envVars.OPENAI_ENABLED}`);
    content = content.replace(/openaiApiKey: ['"].*?['"](?=\s*\/\/\s*Injected during CI\/CD)/g, `openaiApiKey: '${envVars.OPENAI_API_KEY}'`);
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${env} environment file with environment variables`);
  } else {
    console.error(`Error: Environment file ${filePath} not found`);
  }
});

console.log('Environment setup complete!');
