require('dotenv').config(); // Load env from current directory
const { Client, GatewayIntentBits, Events } = require('discord.js');
const messageCreate = require('./events/messageCreate');

// Validate Environment Variables
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is missing! Please add it to your .env file.');
    process.exit(1);
}

// Create Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// Register Event Handlers
client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log('🚀 Discord Copilot is ready!');
});

client.on(messageCreate.name, (...args) => messageCreate.execute(...args));

// Login
client.login(process.env.DISCORD_TOKEN);
