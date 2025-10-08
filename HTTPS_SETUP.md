# 🔒 HTTPS Setup Guide

## 📋 Overview

This guide explains how to enable HTTPS for the Pub Tubal application.

## 🏠 Development (Local)

### 1. Generate Self-Signed Certificates

```bash
# Generate certificates for development
npm run generate-cert
```

This creates:
- `ssl/key.pem` - Private key
- `ssl/cert.pem` - Certificate

### 2. Start Server with HTTPS

```bash
# Start with HTTPS
npm run start:https

# Or for development with auto-reload
npm run dev:https
```

### 3. Access the Application

Open your browser and navigate to:
```
https://localhost:3443
```

**⚠️ Browser Warning:** You'll see a security warning because the certificate is self-signed. This is normal for development. Click "Advanced" and "Proceed to localhost".

---

## 🌐 Production (VPS)

### Option 1: Let's Encrypt (Recommended - FREE)

#### Step 1: Install Certbot

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install certbot
```

**CentOS/RHEL:**
```bash
sudo yum install certbot
```

#### Step 2: Get SSL Certificate

```bash
# Stop any web server using port 80
sudo systemctl stop nginx  # if using nginx
sudo pm2 stop pub-tubal    # stop your app

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be saved at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### Step 3: Copy Certificates to Your App

```bash
# Create ssl directory
cd /opt/apps/pub
mkdir -p ssl

# Copy certificates (requires sudo)
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem

# Set proper permissions
sudo chown $USER:$USER ssl/*.pem
chmod 600 ssl/*.pem
```

#### Step 4: Update PM2 Configuration

Edit `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'pub-tubal',
    script: './server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 2000,
      HTTPS_PORT: 2443,
      USE_HTTPS: 'true',
      SESSION_SECRET: 'your-strong-random-secret-here'
    }
  }]
};
```

#### Step 5: Start with PM2

```bash
pm2 restart ecosystem.config.js
pm2 save
```

#### Step 6: Auto-Renewal

Let's Encrypt certificates expire after 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e

# Add this line (runs twice daily):
0 0,12 * * * certbot renew --quiet --post-hook "cd /opt/apps/pub && sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem && sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem && pm2 restart pub-tubal"
```

---

### Option 2: Using Reverse Proxy (Nginx)

#### Step 1: Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### Step 2: Get Let's Encrypt Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/pub-tubal`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:2000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Step 4: Enable and Restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/pub-tubal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: Update Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw delete allow 2000  # Remove direct access to app port
```

---

## 🔧 Environment Variables

Create a `.env` file (never commit this!):

```bash
# Development
USE_HTTPS=false
PORT=3005

# Production
USE_HTTPS=true
HTTPS_PORT=2443
SESSION_SECRET=your-strong-random-secret-here
```

Generate a strong secret:
```bash
openssl rand -base64 32
```

---

## 🔍 Troubleshooting

### Certificate Errors

```bash
# Check certificate files exist
ls -la ssl/

# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Check private key
openssl rsa -in ssl/key.pem -check
```

### Port Issues

```bash
# Check what's using HTTPS port
sudo lsof -i :3443

# Kill process if needed
sudo kill -9 <PID>
```

### Permission Issues

```bash
# Fix SSL file permissions
chmod 600 ssl/*.pem
chown $USER:$USER ssl/*.pem
```

---

## 📊 Testing HTTPS

```bash
# Test SSL certificate
openssl s_client -connect localhost:3443

# Test with curl
curl -k https://localhost:3443

# Check security headers
curl -I https://yourdomain.com
```

---

## 🔐 Security Best Practices

1. **Never commit SSL certificates or private keys to git**
2. **Use strong SESSION_SECRET in production**
3. **Keep certificates up to date (Let's Encrypt auto-renews)**
4. **Use HTTPS only in production**
5. **Enable secure cookies (automatically done when USE_HTTPS=true)**
6. **Consider using a reverse proxy (Nginx) for additional security**

---

## 📚 Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)

---

## 🆘 Need Help?

If you encounter issues:
1. Check server logs: `pm2 logs pub-tubal`
2. Verify certificates: `openssl x509 -in ssl/cert.pem -text -noout`
3. Test SSL connection: `openssl s_client -connect localhost:3443`
4. Check firewall: `sudo ufw status`

