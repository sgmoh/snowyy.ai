const fs = require('fs');
const { query } = require('./bot/config/database');

async function setupDatabase() {
    try {
        // Read the schema file
        const schema = fs.readFileSync('./schema.sql', 'utf8');
        
        // Execute the schema
        await query(schema);
        console.log('Database schema applied successfully!');
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

setupDatabase(); 