const { query } = require('./bot/config/database');

async function testConnection() {
    try {
        const result = await query('SELECT NOW()');
        console.log('Database connection successful!');
        console.log('Current database time:', result.rows[0].now);
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

testConnection(); 