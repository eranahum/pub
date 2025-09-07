# 🍺 פאב תובל - VPS Deployment Guide

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/eranahum/pub.git
cd pub
npm install
```

### 2. Run with PM2 (Recommended)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs pub-tubal
```

### 3. Run Manually (for testing)
```bash
npm start
```

## 🔧 Troubleshooting

### Port 2000 Not Accessible

#### Check if port is open:
```bash
# Check if port 2000 is listening
netstat -tlnp | grep :2000
# or
ss -tlnp | grep :2000
```

#### Check firewall:
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 2000

# CentOS/RHEL
sudo firewall-cmd --list-ports
sudo firewall-cmd --add-port=2000/tcp --permanent
sudo firewall-cmd --reload
```

#### Check if process is running:
```bash
# Check Node.js processes
ps aux | grep node

# Check PM2 processes
pm2 status
pm2 logs pub-tubal
```

### Database Issues

#### Check database file:
```bash
ls -la pub_database.db
```

#### Test database connection:
```bash
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('pub_database.db');
db.all('SELECT COUNT(*) as count FROM clients', (err, rows) => {
  if (err) console.error('DB Error:', err);
  else console.log('Clients in DB:', rows[0].count);
  db.close();
});
"
```

### Common Issues

#### 1. EADDRINUSE Error
```bash
# Kill processes using port 2000
sudo lsof -ti:2000 | xargs kill -9

# Or find and kill manually
sudo netstat -tlnp | grep :2000
sudo kill -9 <PID>
```

#### 2. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/pub
chmod +x deploy.sh
```

#### 3. Node.js Not Found
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## 🌐 Access the Application

- **Local:** http://localhost:3005
- **VPS:** http://YOUR_VPS_IP:3005
- **External:** http://YOUR_DOMAIN:3005 (if domain configured)

## 📊 Monitoring

### PM2 Commands
```bash
pm2 status          # Check status
pm2 logs pub-tubal  # View logs
pm2 restart pub-tubal  # Restart app
pm2 stop pub-tubal     # Stop app
pm2 delete pub-tubal   # Remove from PM2
```

### Manual Monitoring
```bash
# Check if server responds
curl http://localhost:2000/api/clients

# Check server logs
tail -f logs/out.log
tail -f logs/err.log
```

## 🔒 Security Notes

- The application runs on port 2000
- No authentication required (except payout password: "tuvalu")
- Database file is local: `pub_database.db`
- Consider using a reverse proxy (nginx) for production

## 📁 File Structure
```
pub/
├── server.js              # Main server file
├── app.js                 # Client-side JavaScript
├── index.html             # Main HTML file
├── styles.css             # CSS styles
├── package.json           # Dependencies
├── ecosystem.config.js    # PM2 configuration
├── deploy.sh              # Deployment script
├── pub_database.db        # SQLite database (created on first run)
├── clients.json           # Initial client data
├── drinks.json            # Drinks menu
└── logs/                  # PM2 logs directory
```

## 🆘 Still Having Issues?

1. **Check logs:** `pm2 logs pub-tubal`
2. **Restart:** `pm2 restart pub-tubal`
3. **Check port:** `netstat -tlnp | grep :2000`
4. **Test locally:** `curl http://localhost:2000`
5. **Check firewall:** `sudo ufw status`
