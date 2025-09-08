const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pub_database.db');

console.log('🍺 Checking all orders in database...\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    
    console.log('✅ Connected to database\n');
    
    // Get all orders
    db.all('SELECT * FROM orders ORDER BY id', (err, rows) => {
        if (err) {
            console.error('❌ Error fetching orders:', err.message);
        } else {
            console.log(`📋 Total orders: ${rows.length}\n`);
            
            if (rows.length === 0) {
                console.log('No orders found in database.');
            } else {
                console.log('ID | Name           | Drink        | Qty | Price | Paid | Order Date | Paid Date');
                console.log('-'.repeat(80));
                
                rows.forEach(row => {
                    const name = row.name.substring(0, 12).padEnd(12);
                    const drink = row.drink.substring(0, 12).padEnd(12);
                    const paid = row.paid ? 'Yes' : 'No';
                    const orderDate = row.order_date || 'N/A';
                    const paidDate = row.paid_date || 'N/A';
                    
                    console.log(`${row.id.toString().padStart(2)} | ${name} | ${drink} | ${row.quantity.toString().padStart(3)} | ${row.price_sum.toString().padStart(5)} | ${paid.padStart(4)} | ${orderDate} | ${paidDate}`);
                });
            }
        }
        
        db.close();
    });
});
