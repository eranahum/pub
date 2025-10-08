#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'pub_database.db');

console.log('🍺 פאב תובל - Database Viewer 🍺\n');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database successfully\n');
});

// Function to display clients
function showClients() {
    return new Promise((resolve, reject) => {
        console.log('👥 CLIENTS:');
        console.log('='.repeat(50));
        
        db.all('SELECT id, name, phone FROM clients ORDER BY name', (err, rows) => {
            if (err) {
                console.error('❌ Error fetching clients:', err.message);
                reject(err);
                return;
            }
            
            if (rows.length === 0) {
                console.log('No clients found.');
            } else {
                console.log(`ID | Name                    | Phone`);
                console.log('-'.repeat(50));
                rows.forEach(row => {
                    const name = row.name.padEnd(20);
                    const phone = row.phone || 'N/A';
                    console.log(`${row.id.toString().padStart(2)} | ${name} | ${phone}`);
                });
                console.log(`\nTotal clients: ${rows.length}`);
            }
            console.log('');
            resolve();
        });
    });
}

// Function to display users
function showUsers() {
    return new Promise((resolve, reject) => {
        console.log('👤 USERS:');
        console.log('='.repeat(50));
        
        db.all('SELECT user_id, User_name, Password FROM users ORDER BY user_id', (err, rows) => {
            if (err) {
                console.error('❌ Error fetching users:', err.message);
                reject(err);
                return;
            }
            
            if (rows.length === 0) {
                console.log('No users found.');
            } else {
                console.log(`ID | Username                | Password`);
                console.log('-'.repeat(50));
                rows.forEach(row => {
                    const username = row.User_name.padEnd(20);
                    const password = row.Password.length > 3 ? '***' + row.Password.substring(3) : '***';
                    console.log(`${row.user_id.toString().padStart(2)} | ${username} | ${password}`);
                });
                console.log(`\nTotal users: ${rows.length}`);
            }
            console.log('');
            resolve();
        });
    });
}

// Function to display events
function showEvents() {
    return new Promise((resolve, reject) => {
        console.log('🎉 EVENTS:');
        console.log('='.repeat(70));
        
        db.all('SELECT id, event_name, event_date, created_at FROM events ORDER BY event_date DESC', (err, rows) => {
            if (err) {
                console.error('❌ Error fetching events:', err.message);
                reject(err);
                return;
            }
            
            if (rows.length === 0) {
                console.log('No events found.');
            } else {
                console.log(`ID | Event Name                    | Event Date | Created At`);
                console.log('-'.repeat(70));
                rows.forEach(row => {
                    const eventName = row.event_name.padEnd(25);
                    const eventDate = row.event_date;
                    const createdDate = row.created_at ? row.created_at.split('T')[0] : 'N/A';
                    console.log(`${row.id.toString().padStart(2)} | ${eventName} | ${eventDate} | ${createdDate}`);
                });
                console.log(`\nTotal events: ${rows.length}`);
            }
            console.log('');
            resolve();
        });
    });
}

// Function to display orders
function showOrders() {
    return new Promise((resolve, reject) => {
        console.log('🍺 ORDERS:');
        console.log('='.repeat(80));
        
        db.all(`
            SELECT id, name, drink, quantity, price_sum, paid, 
                   order_date, paid_date, event 
            FROM orders 
            ORDER BY id DESC 
            LIMIT 20
        `, (err, rows) => {
            if (err) {
                console.error('❌ Error fetching orders:', err.message);
                reject(err);
                return;
            }
            
            if (rows.length === 0) {
                console.log('No orders found.');
            } else {
                console.log('ID | Name           | Drink        | Qty | Price | Paid | Order Date | Paid Date | Event');
                console.log('-'.repeat(90));
                rows.forEach(row => {
                    const name = row.name.substring(0, 12).padEnd(12);
                    const drink = row.drink.substring(0, 12).padEnd(12);
                    const paid = row.paid ? 'Yes' : 'No';
                    const orderDate = row.order_date || 'N/A';
                    const paidDate = row.paid_date || 'N/A';
                    const event = row.event || 'N/A';
                    
                    console.log(`${row.id.toString().padStart(2)} | ${name} | ${drink} | ${row.quantity.toString().padStart(3)} | ${row.price_sum.toString().padStart(5)} | ${paid.padStart(4)} | ${orderDate} | ${paidDate} | ${event}`);
                });
                console.log(`\nShowing last ${rows.length} orders`);
            }
            console.log('');
            resolve();
        });
    });
}

// Function to show summary statistics
function showSummary() {
    return new Promise((resolve, reject) => {
        console.log('📊 SUMMARY:');
        console.log('='.repeat(30));
        
        // Get total orders
        db.get('SELECT COUNT(*) as total FROM orders', (err, totalRow) => {
            if (err) {
                console.error('❌ Error getting total orders:', err.message);
                reject(err);
                return;
            }
            
            // Get unpaid orders
            db.get('SELECT COUNT(*) as unpaid FROM orders WHERE paid = FALSE', (err, unpaidRow) => {
                if (err) {
                    console.error('❌ Error getting unpaid orders:', err.message);
                    reject(err);
                    return;
                }
                
                // Get total revenue
                db.get('SELECT SUM(price_sum) as total_revenue FROM orders WHERE paid = TRUE', (err, revenueRow) => {
                    if (err) {
                        console.error('❌ Error getting revenue:', err.message);
                        reject(err);
                        return;
                    }
                    
                    // Get unpaid amount
                    db.get('SELECT SUM(price_sum) as unpaid_amount FROM orders WHERE paid = FALSE', (err, unpaidAmountRow) => {
                        if (err) {
                            console.error('❌ Error getting unpaid amount:', err.message);
                            reject(err);
                            return;
                        }
                        
                        console.log(`Total orders: ${totalRow.total}`);
                        console.log(`Unpaid orders: ${unpaidRow.unpaid}`);
                        console.log(`Paid orders: ${totalRow.total - unpaidRow.unpaid}`);
                        console.log(`Total revenue: ₪${revenueRow.total_revenue || 0}`);
                        console.log(`Unpaid amount: ₪${unpaidAmountRow.unpaid_amount || 0}`);
                        console.log('');
                        resolve();
                    });
                });
            });
        });
    });
}

// Main function
async function main() {
    try {
        await showClients();
        await showUsers();
        await showEvents();
        await showOrders();
        await showSummary();
        
        console.log('✅ Database view complete!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('🔒 Database connection closed.');
            }
        });
    }
}

// Run the script
main();
