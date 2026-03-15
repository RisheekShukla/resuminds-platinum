// Node 18+ has global fetch, no import needed

const API_URL = 'http://127.0.0.1:5000/api';
const TEST_USER = {
    name: 'Test Account',
    email: `test-${Date.now()}@example.com`,
    password: 'password123'
};

async function testAuth() {
    console.log('🧪 Starting Authentication Integration Test...');

    try {
        // 1. Register
        console.log('📝 Registering user...');
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });
        const regData = await regRes.json();

        if (!regData.success) {
            throw new Error(`Registration failed: ${regData.error}`);
        }
        console.log('✅ Registration successful');

        // 2. Login
        console.log('🔑 Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_USER.email,
                password: TEST_USER.password
            })
        });
        const loginData = await loginRes.json();

        if (!loginData.success) {
            throw new Error(`Login failed: ${loginData.error}`);
        }
        console.log('✅ Login successful');
        const token = loginData.data.token;

        // 3. Verify /me
        console.log('👤 Fetching current user info...');
        const meRes = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const meData = await meRes.json();

        if (!meData.success || meData.data.email !== TEST_USER.email) {
            throw new Error(`Failed to fetch correct user info: ${meData.error}`);
        }
        console.log(`✅ Verified current user: ${meData.data.name} (${meData.data.email})`);
        console.log(`🔒 isGuest: ${meData.data.isGuest === false ? 'No (Correct)' : 'Yes (Incorrect)'}`);

        console.log('\n✨ All authentication tests passed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

testAuth();
