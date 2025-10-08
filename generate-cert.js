#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating Self-Signed SSL Certificates\n');

const sslDir = path.join(__dirname, 'ssl');

// Create ssl directory if it doesn't exist
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir);
    console.log('✅ Created ssl/ directory');
}

try {
    // Generate self-signed certificate
    console.log('🔑 Generating certificate...');
    
    execSync(`openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=IL/ST=Israel/L=TelAviv/O=PubTubal/CN=localhost"`, {
        stdio: 'inherit'
    });
    
    console.log('\n✅ SSL certificates generated successfully!');
    console.log('📁 Location: ./ssl/');
    console.log('🔑 Files: key.pem, cert.pem');
    console.log('\n⚠️  These are self-signed certificates for DEVELOPMENT only!');
    console.log('🌐 For production, use Let\'s Encrypt: https://letsencrypt.org/\n');
    
} catch (error) {
    console.error('\n❌ Error generating certificates');
    console.error('💡 Make sure OpenSSL is installed:');
    console.error('   - Windows: https://slproweb.com/products/Win32OpenSSL.html');
    console.error('   - Linux: sudo apt-get install openssl');
    console.error('   - Mac: brew install openssl');
    process.exit(1);
}

