#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pub_database.db');

console.log('🍺 Quick DB Check 🍺\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ DB Error:', err.message);
        process.exit(1);
    }
    
    // Quick stats
    db.get('SELECT COUNT(*) as clients FROM clients', (err, clientRow) => {
        if (err) console.error('Client count error:', err);
        else console.log(`👥 Clients: ${clientRow.clients}`);
    });
    
    db.get('SELECT COUNT(*) as total FROM orders', (err, totalRow) => {
        if (err) console.error('Total orders error:', err);
        else console.log(`🍺 Total orders: ${totalRow.total}`);
    });
    
    db.get('SELECT COUNT(*) as unpaid FROM orders WHERE paid = FALSE', (err, unpaidRow) => {
        if (err) console.error('Unpaid orders error:', err);
        else console.log(`💰 Unpaid orders: ${unpaidRow.unpaid}`);
    });
    
    db.get('SELECT SUM(price_sum) as revenue FROM orders WHERE paid = TRUE', (err, revenueRow) => {
        if (err) console.error('Revenue error:', err);
        else console.log(`💵 Revenue: ₪${revenueRow.revenue || 0}`);
    });
    
    // Show recent orders
    console.log('\n📋 Recent Orders:');
    db.all('SELECT name, drink, quantity, price_sum, paid, order_date FROM orders ORDER BY id DESC LIMIT 5', (err, rows) => {
        if (err) {
            console.error('Recent orders error:', err);
        } else if (rows.length === 0) {
            console.log('No orders found.');
        } else {
            rows.forEach(row => {
                const status = row.paid ? '✅' : '⏳';
                console.log(`${status} ${row.name} - ${row.drink} (${row.quantity}x) - ₪${row.price_sum} - ${row.order_date}`);
            });
        }
        
        db.close();
    });
});
