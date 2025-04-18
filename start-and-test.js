const { spawn } = require('child_process');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function waitForServer(maxAttempts = 10) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Checking server status (attempt ${attempt}/${maxAttempts})...`);
            const response = await axios.get(`${BASE_URL}/status`);
            console.log('Server status:', response.data);
            return true;
        } catch (error) {
            if (attempt === maxAttempts) {
                console.error('Server failed to respond after maximum attempts');
                return false;
            }
            // Wait 1 second before next attempt
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return false;
}

// Start the server
const server = spawn('node', ['bot.js'], {
    stdio: 'inherit'
});

// Wait for server to start and then run tests
(async () => {
    try {
        // Wait for server to be ready
        const serverReady = await waitForServer();
        if (!serverReady) {
            console.error('Server failed to start properly');
            server.kill();
            return;
        }

        // Test registration
        console.log('\nTesting registration...');
        const registerResponse = await axios.post(`${BASE_URL}/api/register`, {
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpassword123'
        });
        console.log('Registration successful:', registerResponse.data);

        // Test login
        console.log('\nTesting login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
            username: 'testuser',
            password: 'testpassword123'
        });
        console.log('Login successful:', loginResponse.data);

    } catch (error) {
        if (error.response) {
            console.error('Error response:', {
                status: error.response.status,
                data: error.response.data,
                path: error.response.config.url
            });
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        // Stop the server
        server.kill();
    }
})(); 