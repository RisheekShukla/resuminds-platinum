import fetch from 'node-fetch';

async function testLogin() {
    const url = 'http://localhost:5000/api/auth/login';
    const credentials = {
        email: 'bbl@gmail.com',
        password: '123456'
    };

    console.log(`[Test] Attempting login to ${url}...`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Login Successful!');
            console.log('Full Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ Login Failed:', data.message || response.statusText);
            // If failed, try registering just in case
            if (data.message?.includes('Invalid')) {
                console.log('[Test] Password might be wrong or user doesn\'t exist. Attempting auto-registration...');
                const regRes = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...credentials, name: 'BBL User' })
                });
                const regData = await regRes.json();
                console.log(regRes.ok ? '✅ Auto-Registration Successful!' : '❌ Registration failed too.');
            }
        }
    } catch (err) {
        console.log('❌ Connection Error:', err.message);
    }
}

testLogin();
