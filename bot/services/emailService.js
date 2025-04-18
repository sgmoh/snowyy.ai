const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Using Gmail service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Function to send verification email
async function sendVerificationEmail(email, username, verificationCode) {
    try {
        // Create verification link
        const verificationLink = `http://localhost:3000/api/verify-email?email=${encodeURIComponent(email)}&code=${verificationCode}`;
        
        // Email content
        const mailOptions = {
            from: `"Snowy.ai" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Snowy.ai Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a9eff;">Welcome to Snowy.ai!</h2>
                    <p>Hello ${username},</p>
                    <p>Thank you for creating an account with Snowy.ai. Please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #4a9eff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4a9eff;">${verificationLink}</p>
                    <p>If you didn't create this account, you can safely ignore this email.</p>
                    <p>Best regards,<br>The Snowy.ai Team</p>
                </div>
            `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Failed to send verification email:', error);
        return false;
    }
}

// Function to generate a random verification code
function generateVerificationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = {
    sendVerificationEmail,
    generateVerificationCode
}; 