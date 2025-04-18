require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Create HTTP server for Render
app.get('/', (req, res) => {
    res.send('Snowy.ai Discord Bot is running!');
});

// Uptime monitoring endpoint
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        botStatus: client.readyAt ? 'connected' : 'disconnected'
    });
});

// Start the HTTP server
app.listen(port, () => {
    console.log(`🌐 HTTP server running on port ${port}`);
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`🌨️ ${client.user.tag} is online and ready!`);
    
    // Set the bot's activity with the correct ActivityType
    client.user.setActivity('snowy.ai', { type: ActivityType.Watching });
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN)
    .then(() => {
        console.log('Bot login successful!');
    })
    .catch(error => {
        console.error('Failed to login:', error);
    }); 