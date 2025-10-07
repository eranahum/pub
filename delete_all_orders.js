#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'pub_database.db');

console.log('🍺 Delete All Orders Script 🍺\n');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database successfully\n');
    
    // First, show current orders count
    db.get('SELECT COUNT(*) as count FROM orders', (err, row) => {
        if (err) {
            console.error('❌ Error counting orders:', err.message);
            db.close();
            process.exit(1);
        }
        
        console.log(`📊 Current number of orders: ${row.count}\n`);
        
        if (row.count === 0) {
            console.log('✅ No orders to delete. Table is already empty.');
            db.close();
            return;
        }
        
        console.log('⚠️  Deleting all orders...\n');
        
        // Delete all orders
        db.run('DELETE FROM orders', function(err) {
            if (err) {
                console.error('❌ Error deleting orders:', err.message);
            } else {
                console.log(`✅ Successfully deleted ${this.changes} orders!`);
                console.log('✅ Orders table is now empty.\n');
            }
            
            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('🔒 Database connection closed.');
                }
            });
        });
    });
});

