require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const DatabaseManager = require('./database/DatabaseManager');
const { startServer, setDatabaseManager } = require('./api');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Initialize database
const db = new DatabaseManager(client);

// Start API server regardless of Discord connection
async function startServices() {
    try {
        // Initialize database
        await db.initialize();
        console.log('Database initialized successfully!');
        
        // Start API server
        setDatabaseManager(db);
        startServer(3001);
    } catch (error) {
        console.error('Error starting services:', error);
    }
}

// When the client is ready, run this code (only once)
client.once('ready', async () => {
    try {
        console.log(`🌨️ ${client.user.tag} is online and ready!`);
        
        // Set the bot's activity
        client.user.setActivity('snowy.ai', { type: ActivityType.Watching });
    } catch (error) {
        console.error('Error during Discord initialization:', error);
    }
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

// Start services immediately
startServices();

// Try to login to Discord (but don't block API server)
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to login to Discord:', error);
});

// Example command handling
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Example commands for testing the database
    if (message.content.startsWith('!createuser')) {
        const [_, username, password, email] = message.content.split(' ');
        if (!username || !password || !email) {
            return message.reply('Please provide username, password, and email!');
        }
        
        try {
            await db.createUser(username, password, email);
            
            // Log the email to the specified channel
            const logChannel = await client.channels.fetch('1362542401087868979');
            if (logChannel) {
                await logChannel.send(`📧 New user registration: ${username} (${email})`);
            }
            
            await message.reply('User created successfully! Check your email for verification.');
        } catch (error) {
            await message.reply('Failed to create user.');
        }
    }

    if (message.content.startsWith('!verifyemail')) {
        const [_, email] = message.content.split(' ');
        if (!email) {
            return message.reply('Please provide an email to verify!');
        }
        
        try {
            const success = await db.verifyEmail(email);
            await message.reply(success ? 'Email verified successfully!' : 'Email verification failed.');
        } catch (error) {
            await message.reply('Failed to verify email.');
        }
    }

    if (message.content.startsWith('!validateuser')) {
        const [_, username, password] = message.content.split(' ');
        if (!username || !password) {
            return message.reply('Please provide username and password!');
        }
        
        const isValid = await db.validateUser(username, password);
        await message.reply(isValid ? 'Login successful!' : 'Invalid credentials.');
    }
}); 