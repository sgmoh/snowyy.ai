const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { query } = require('../bot/config/database');

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Register endpoint
router.post('/register', async (req, res) => {
    console.log('Register request received:', req.body);
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        // Check if user already exists
        const existingUser = await query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate verification token
        const verificationToken = require('crypto').randomBytes(32).toString('hex');

        // Insert new user
        const result = await query(
            'INSERT INTO users (username, email, password_hash, verification_token) VALUES ($1, $2, $3, $4) RETURNING id, username, email',
            [username, email, passwordHash, verificationToken]
        );

        console.log('User registered successfully:', result.rows[0]);

        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    console.log('Login request received:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Find user
        const result = await query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if email is verified
        if (!user.verified) {
            return res.status(403).json({ error: 'Please verify your email first' });
        }

        // Update last login
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// Bot invite URL endpoint
router.get('/bot-invite', (req, res) => {
    res.json({
        inviteUrl: process.env.BOT_INVITE_URL
    });
});

// Debug endpoint to list all registered routes
router.get('/routes', (req, res) => {
    const routes = router.stack.map(layer => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods)
    }));
    res.json(routes);
});

module.exports = router; 