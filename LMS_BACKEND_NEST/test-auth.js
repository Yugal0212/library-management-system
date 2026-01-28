const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testAuth() {
  try {
    console.log('Testing authentication flow...\n');
    
    // Step 1: Try to access protected route without token
    console.log('1. Testing access without token:');
    try {
      const response = await axios.get(`${BASE_URL}/auth/me`);
      console.log('Unexpected success:', response.data);
    } catch (error) {
      console.log('Expected error:', error.response?.status, error.response?.data);
    }
    
    console.log('\n2. You need to:');
    console.log('   a) Register a user (POST /auth/register)');
    console.log('   b) Verify email (POST /auth/verify-email)');  
    console.log('   c) Login (POST /auth/login) to get access token');
    console.log('   d) Use Bearer token in Authorization header');
    
    console.log('\nExample:');
    console.log('Authorization: Bearer <your-access-token>');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuth();
