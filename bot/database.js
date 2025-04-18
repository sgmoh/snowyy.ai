class DatabaseManager {
    constructor(client) {
        this.client = client;
        this.db = null;
    }

    async initialize() {
        try {
            this.db = await open({
                filename: 'users.db',
                driver: sqlite3.Database
            });

            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    isVerified INTEGER DEFAULT 0,
                    verificationCode TEXT,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            console.log('Database initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing database:', error);
            return false;
        }
    }

    async createUser(username, password, email) {
        try {
            const verificationCode = Math.random().toString(36).substring(2, 15);
            const hashedPassword = await bcrypt.hash(password, 10);
            
            await this.db.run(
                'INSERT INTO users (username, password, email, verificationCode) VALUES (?, ?, ?, ?)',
                [username, hashedPassword, email, verificationCode]
            );

            // Send verification email
            await this.sendVerificationEmail(email, verificationCode);
            
            return { username, email };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            return await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    async verifyEmail(email, code) {
        try {
            const user = await this.getUserByEmail(email);
            if (!user) {
                return false;
            }

            if (user.verificationCode === code) {
                await this.db.run(
                    'UPDATE users SET isVerified = 1, verificationCode = NULL WHERE email = ?',
                    [email]
                );
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error verifying email:', error);
            return false;
        }
    }

    async getUsernameByEmail(email) {
        try {
            const user = await this.getUserByEmail(email);
            return user ? user.username : null;
        } catch (error) {
            console.error('Error getting username by email:', error);
            return null;
        }
    }

    async resendVerificationEmail(email) {
        try {
            const user = await this.getUserByEmail(email);
            if (!user) {
                return false;
            }

            const verificationCode = Math.random().toString(36).substring(2, 15);
            await this.db.run(
                'UPDATE users SET verificationCode = ? WHERE email = ?',
                [verificationCode, email]
            );

            await this.sendVerificationEmail(email, verificationCode);
            return true;
        } catch (error) {
            console.error('Error resending verification email:', error);
            return false;
        }
    }

    async sendVerificationEmail(email, code) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Verify your Snowy.ai account',
                html: `
                    <h1>Welcome to Snowy.ai!</h1>
                    <p>Please verify your email address by clicking the link below:</p>
                    <a href="http://localhost:3000/verify.html?email=${encodeURIComponent(email)}&code=${code}">
                        Verify Email
                    </a>
                `
            };

            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending verification email:', error);
            return false;
        }
    }
}

module.exports = DatabaseManager; 