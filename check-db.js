const { query } = require('./bot/config/database');

async function checkDatabase() {
    try {
        // Check if users table exists
        const tableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('Users table does not exist. Creating it...');
            await query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    verified BOOLEAN DEFAULT FALSE,
                    verification_token VARCHAR(255),
                    last_login TIMESTAMP WITH TIME ZONE
                );
            `);
            console.log('Users table created successfully');
        } else {
            console.log('Users table exists');
        }

        // Check if indexes exist
        const indexCheck = await query(`
            SELECT EXISTS (
                SELECT FROM pg_indexes 
                WHERE tablename = 'users' 
                AND indexname = 'idx_users_email'
            );
        `);

        if (!indexCheck.rows[0].exists) {
            console.log('Creating indexes...');
            await query('CREATE INDEX idx_users_email ON users(email)');
            await query('CREATE INDEX idx_users_username ON users(username)');
            console.log('Indexes created successfully');
        } else {
            console.log('Indexes exist');
        }

        // Test insert and select
        console.log('\nTesting database operations...');
        const testUser = {
            username: 'testuser_' + Date.now(),
            email: 'test_' + Date.now() + '@example.com',
            password: 'testpassword123'
        };

        // Insert test user
        const salt = await require('bcrypt').genSalt(10);
        const passwordHash = await require('bcrypt').hash(testUser.password, salt);
        
        const insertResult = await query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            [testUser.username, testUser.email, passwordHash]
        );
        console.log('Test user inserted successfully:', insertResult.rows[0]);

        // Select test user
        const selectResult = await query(
            'SELECT * FROM users WHERE id = $1',
            [insertResult.rows[0].id]
        );
        console.log('Test user retrieved successfully:', selectResult.rows[0]);

        // Clean up test user
        await query('DELETE FROM users WHERE id = $1', [insertResult.rows[0].id]);
        console.log('Test user cleaned up');

    } catch (error) {
        console.error('Database check failed:', error);
    }
}

checkDatabase(); 