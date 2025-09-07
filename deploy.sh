#!/bin/bash

# פאב תובל - VPS Deployment Script
echo "🍺 מתחיל פריסה של פאב תובל..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js לא מותקן. מתקין Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 מתקין PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
echo "📦 מתקין תלויות..."
npm install

# Create logs directory
mkdir -p logs

# Stop existing PM2 process if running
pm2 stop pub-tubal 2>/dev/null || true
pm2 delete pub-tubal 2>/dev/null || true

# Start the application with PM2
echo "🚀 מפעיל את האפליקציה..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

echo "✅ הפריסה הושלמה בהצלחה!"
echo "🌐 האפליקציה זמינה בכתובת: http://YOUR_VPS_IP:2000"
echo "📊 לבדיקת סטטוס: pm2 status"
echo "📋 לוגים: pm2 logs pub-tubal"
