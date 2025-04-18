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

async function testAuth() {
    // First check if server is running
    const serverRunning = await waitForServer();
    if (!serverRunning) {
        console.log('Please make sure the server is running with: node bot.js');
        return;
    }

    try {
        // Check test endpoint
        console.log('\nChecking test endpoint...');
        const testResponse = await axios.get(`${BASE_URL}/api/test`);
        console.log('Test endpoint response:', testResponse.data);

        // Check available routes
        console.log('\nChecking available routes...');
        const routesResponse = await axios.get(`${BASE_URL}/api/routes`);
        console.log('Available routes:', routesResponse.data);

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
    }
}

testAuth(); 