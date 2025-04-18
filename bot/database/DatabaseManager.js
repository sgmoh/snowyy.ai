const config = require('../config');
const crypto = require('crypto');
const { sendVerificationEmail, generateVerificationCode } = require('../services/emailService');

class DatabaseManager {
    constructor(client) {
        this.client = client;
        this.cache = {
            users: new Map(),
            settings: new Map(),
            emails: new Map(),
            verificationCodes: new Map()
        };
        this.mainChannel = null;
        this.backupChannel = null;
        this.emailChannel = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // For local testing, just initialize the cache
            if (!this.client || !this.client.isReady()) {
                console.log('Running in local test mode - Discord features disabled');
                this.isInitialized = true;
                return;
            }

            this.mainChannel = await this.client.channels.fetch(config.channels.mainDatabase);
            this.backupChannel = await this.client.channels.fetch(config.channels.backupDatabase);
            await this.loadData();
            this.startBackupInterval();
            this.isInitialized = true;
            console.log('Database initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            // Still mark as initialized for local testing
            this.isInitialized = true;
        }
    }

    async loadData() {
        try {
            const messages = await this.mainChannel.messages.fetch({ limit: 100 });
            for (const message of messages.values()) {
                try {
                    const data = JSON.parse(message.content);
                    if (data.type === 'users') {
                        this.cache.users = new Map(Object.entries(data.data));
                    } else if (data.type === 'settings') {
                        this.cache.settings = new Map(Object.entries(data.data));
                    } else if (data.type === 'emails') {
                        this.cache.emails = new Map(Object.entries(data.data));
                    } else if (data.type === 'verificationCodes') {
                        this.cache.verificationCodes = new Map(Object.entries(data.data));
                    }
                } catch (e) {
                    console.error('Failed to parse message:', e);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    async saveData(type = 'all') {
        try {
            if (type === 'all' || type === 'users') {
                const usersData = {
                    type: 'users',
                    data: Object.fromEntries(this.cache.users),
                    timestamp: Date.now()
                };
                await this.saveToChannel(usersData, 'users');
            }
            if (type === 'all' || type === 'settings') {
                const settingsData = {
                    type: 'settings',
                    data: Object.fromEntries(this.cache.settings),
                    timestamp: Date.now()
                };
                await this.saveToChannel(settingsData, 'settings');
            }
            if (type === 'all' || type === 'emails') {
                const emailsData = {
                    type: 'emails',
                    data: Object.fromEntries(this.cache.emails),
                    timestamp: Date.now()
                };
                await this.saveToChannel(emailsData, 'emails');
            }
            if (type === 'all' || type === 'verificationCodes') {
                const verificationCodesData = {
                    type: 'verificationCodes',
                    data: Object.fromEntries(this.cache.verificationCodes),
                    timestamp: Date.now()
                };
                await this.saveToChannel(verificationCodesData, 'verificationCodes');
            }
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    async saveToChannel(data, type) {
        const json = JSON.stringify(data);
        const chunks = this.splitMessage(json);
        
        // Delete old messages of this type
        const messages = await this.mainChannel.messages.fetch({ limit: 100 });
        const oldMessages = messages.filter(m => {
            try {
                const parsed = JSON.parse(m.content);
                return parsed.type === type;
            } catch {
                return false;
            }
        });
        await Promise.all(oldMessages.map(m => m.delete()));

        // Save new data
        for (const chunk of chunks) {
            await this.mainChannel.send(chunk);
        }

        // Backup to backup channel
        await this.backup();
    }

    async backup() {
        try {
            // Clear backup channel
            const messages = await this.backupChannel.messages.fetch({ limit: 100 });
            await Promise.all(messages.map(m => m.delete()));

            // Save current data
            const allData = {
                users: Object.fromEntries(this.cache.users),
                settings: Object.fromEntries(this.cache.settings),
                emails: Object.fromEntries(this.cache.emails),
                verificationCodes: Object.fromEntries(this.cache.verificationCodes),
                timestamp: Date.now()
            };

            const json = JSON.stringify(allData);
            const chunks = this.splitMessage(json);

            for (const chunk of chunks) {
                await this.backupChannel.send(chunk);
            }
        } catch (error) {
            console.error('Failed to create backup:', error);
        }
    }

    startBackupInterval() {
        setInterval(() => this.backup(), config.backupInterval);
    }

    splitMessage(text) {
        const chunks = [];
        for (let i = 0; i < text.length; i += config.maxMessageSize) {
            chunks.push(text.slice(i, i + config.maxMessageSize));
        }
        return chunks;
    }

    // User management methods
    async createUser(username, password, email) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        
        // Generate verification code
        const verificationCode = generateVerificationCode();
        
        const userData = {
            username,
            email,
            salt,
            hash,
            createdAt: Date.now(),
            settings: {},
            emailVerified: false
        };

        this.cache.users.set(username, userData);
        await this.saveData('users');

        // Store email separately
        this.cache.emails.set(email, {
            username,
            createdAt: Date.now(),
            verified: false
        });
        await this.saveData('emails');

        // Store verification code
        this.cache.verificationCodes.set(email, {
            code: verificationCode,
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        });
        await this.saveData('verificationCodes');

        // Send verification email
        await sendVerificationEmail(email, username, verificationCode);

        return userData;
    }

    async validateUser(username, password) {
        const user = this.cache.users.get(username);
        if (!user) return false;

        const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
        return hash === user.hash;
    }

    async verifyEmail(email, code) {
        const emailData = this.cache.emails.get(email);
        if (!emailData) return false;

        const verificationData = this.cache.verificationCodes.get(email);
        if (!verificationData) return false;

        // Check if code matches and hasn't expired
        if (verificationData.code !== code || Date.now() > verificationData.expiresAt) {
            return false;
        }

        emailData.verified = true;
        emailData.verifiedAt = Date.now();
        this.cache.emails.set(email, emailData);

        // Update user's email verification status
        const user = this.cache.users.get(emailData.username);
        if (user) {
            user.emailVerified = true;
            this.cache.users.set(emailData.username, user);
        }

        // Remove verification code
        this.cache.verificationCodes.delete(email);

        await this.saveData('emails');
        await this.saveData('users');
        await this.saveData('verificationCodes');
        return true;
    }

    async getUserByEmail(email) {
        const emailData = this.cache.emails.get(email);
        if (!emailData) return null;
        return this.cache.users.get(emailData.username);
    }

    // Settings management
    async updateUserSettings(username, settings) {
        const user = this.cache.users.get(username);
        if (!user) return false;

        user.settings = { ...user.settings, ...settings };
        this.cache.users.set(username, user);
        await this.saveData('users');
        return true;
    }
}

module.exports = DatabaseManager; 