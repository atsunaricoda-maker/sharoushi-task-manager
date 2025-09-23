// Create an emergency auth token for testing
// Based on the SafeBase64 encoding system from the codebase

function SafeBase64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function SafeBase64Decode(str) {
    // Add padding back
    str += '='.repeat((4 - str.length % 4) % 4);
    // Replace safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(str)));
}

// Create emergency auth payload
const emergencyPayload = {
    sub: "1", // User ID
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
    emergencyAuth: true
};

const encodedPayload = SafeBase64Encode(JSON.stringify(emergencyPayload));
console.log('Emergency Auth Token:', encodedPayload);

// Test decode
try {
    const decoded = JSON.parse(SafeBase64Decode(encodedPayload));
    console.log('Decoded payload:', decoded);
} catch (error) {
    console.error('Decode test failed:', error);
}