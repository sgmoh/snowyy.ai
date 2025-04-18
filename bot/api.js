const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();

// Enable CORS with credentials
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Parse JSON bodies
app.use(express.json());

// Configure session middleware
app.use(session({
    secret: 'snowy-ai-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

// Define the website directory path
const websiteDir = path.join(__dirname, '../website');

// Serve static files from the website directory
app.use(express.static(websiteDir));

// Reference to our database manager (will be set when bot initializes)
let databaseManager = null;

// Set database manager reference
const setDatabaseManager = (db) => {
    databaseManager = db;
};

// API Routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // First check if user exists
        const user = databaseManager.cache.users.get(username);
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Validate password using the correct method from DatabaseManager
        const isValid = await databaseManager.validateUser(username, password);
        if (!isValid) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // For testing purposes, bypass email verification
        // if (!user.emailVerified) {
        //     return res.status(403).json({ error: 'Please verify your email first' });
        // }

        // Set user session
        req.session.user = {
            username: user.username,
            email: user.email
        };

        // Save session before sending response
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            console.log('Login successful for user:', username);
            res.json({ 
                success: true,
                user: {
                    username: user.username,
                    email: user.email
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/register', async (req, res) => {
    if (!databaseManager) {
        return res.status(500).json({ error: 'Database not initialized' });
    }

    const { username, password, email } = req.body;
    
    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    try {
        // Check if username already exists
        if (databaseManager.cache.users.has(username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if email already exists
        if (databaseManager.cache.emails.has(email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create user using DatabaseManager's createUser method
        const userData = await databaseManager.createUser(username, password, email);
        
        // Log the email to Discord if we have access to the client
        if (databaseManager.client) {
            try {
                const logChannel = await databaseManager.client.channels.fetch('1362542401087868979');
                if (logChannel) {
                    await logChannel.send(`📧 New user registration: ${username} (${email})`);
                }
            } catch (error) {
                console.error('Failed to log email to Discord:', error);
            }
        }
        
        res.json({ success: true, message: 'User created successfully! Check your email for verification.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/verify-email', async (req, res) => {
    if (!databaseManager) {
        return res.status(500).json({ error: 'Database not initialized' });
    }

    const { email, code } = req.query;
    
    if (!email || !code) {
        return res.status(400).json({ error: 'Email and verification code are required' });
    }

    try {
        const success = await databaseManager.verifyEmail(email, code);
        if (success) {
            // Get the username for the verified email
            const username = await databaseManager.getUsernameByEmail(email);
            res.json({ 
                success: true, 
                message: 'Email verified successfully',
                username: username 
            });
        } else {
            res.status(400).json({ error: 'Invalid verification code' });
        }
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/verify-email', async (req, res) => {
    if (!databaseManager) {
        return res.status(500).json({ error: 'Database not initialized' });
    }

    const { email, code } = req.body;
    
    if (!email || !code) {
        return res.status(400).json({ error: 'Email and verification code are required' });
    }

    try {
        const success = await databaseManager.verifyEmail(email, code);
        if (success) {
            res.json({ success: true, message: 'Email verified successfully' });
        } else {
            res.status(400).json({ error: 'Email verification failed' });
        }
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/resend-verification', async (req, res) => {
    if (!databaseManager) {
        return res.status(500).json({ error: 'Database not initialized' });
    }

    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const success = await databaseManager.resendVerificationEmail(email);
        if (success) {
            res.json({ success: true, message: 'Verification email sent successfully' });
        } else {
            res.status(400).json({ error: 'Failed to send verification email' });
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Session check endpoint
app.get('/api/check-session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ 
            success: true,
            user: req.session.user
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// HTML routes
app.get('/', (req, res) => {
    res.sendFile(path.join(websiteDir, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(websiteDir, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(websiteDir, 'signup.html'));
});

app.get('/test-register', (req, res) => {
    res.sendFile(path.join(websiteDir, 'test-register.html'));
});

app.get('/verify', (req, res) => {
    res.sendFile(path.join(websiteDir, 'verify.html'));
});

app.get('/dashboard', (req, res) => {
    console.log('Session check:', req.session); // Debug log
    if (!req.session || !req.session.user) {
        console.log('No session or user found, redirecting to login'); // Debug log
        return res.redirect('/login');
    }
    console.log('User authenticated:', req.session.user); // Debug log
    res.sendFile(path.join(websiteDir, 'dashboard.html'));
});

// Add a logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// Fallback route for any unmatched routes - moved to the end
app.use((req, res) => {
    res.sendFile(path.join(websiteDir, 'index.html'));
});

const startServer = (port = 3000) => {
    try {
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`API server running on http://localhost:${port}`);
            console.log('Available routes:');
            console.log('- GET  /');
            console.log('- GET  /login');
            console.log('- GET  /signup');
            console.log('- GET  /test-register');
            console.log('- GET  /verify');
            console.log('- GET  /dashboard');
            console.log('- POST /api/login');
            console.log('- POST /api/register');
            console.log('- POST /api/verify-email');
            console.log('- POST /api/resend-verification');
            console.log('- POST /api/logout');
            console.log('- GET  /api/check-session');
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${port} is already in use. Please try a different port.`);
            } else {
                console.error('Server error:', error);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

module.exports = { startServer, setDatabaseManager }; 