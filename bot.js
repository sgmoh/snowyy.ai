require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const express = require('express');
const path = require('path');
const apiRouter = require('./routes/api');
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

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:;");
    next();
});

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Request body:', req.body);
    next();
});

// Serve static files from the website directory
app.use(express.static(path.join(__dirname, 'website')));

// Mount API routes
app.use('/api', apiRouter);

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        botStatus: client.readyAt ? 'connected' : 'disconnected',
        databaseStatus: 'connected'
    });
});

// Serve the main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'website', 'index.html'));
});

// Start the HTTP server
const server = app.listen(port, () => {
    console.log(`🌐 HTTP server running on port ${port}`);
    console.log(`🌐 Website available at http://localhost:${port}`);
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`🌨️ ${client.user.tag} is online and ready!`);
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