const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3005;

// Database setup
const dbPath = path.join(__dirname, 'pub_database.db');
let db = null;

// Initialize database
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
            } else {
                console.log('Connected to SQLite database');
                
                // Create tables if they don't exist
                db.serialize(() => {
                    db.run(`
                        CREATE TABLE IF NOT EXISTS orders (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            drink TEXT NOT NULL,
                            quantity INTEGER NOT NULL,
                            price_sum REAL NOT NULL,
                            paid BOOLEAN DEFAULT FALSE,
                            order_date TEXT NOT NULL,
                            paid_date TEXT
                        )
                    `);
                    
                    db.run(`
                        CREATE TABLE IF NOT EXISTS clients (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL UNIQUE,
                            phone TEXT NOT NULL
                        )
                    `);
                    
                    // Add new columns to existing orders table if they don't exist
                    db.run(`ALTER TABLE orders ADD COLUMN order_date TEXT`, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            console.error('Error adding order_date column:', err);
                        }
                    });
                    
                    db.run(`ALTER TABLE orders ADD COLUMN paid_date TEXT`, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            console.error('Error adding paid_date column:', err);
                        }
                    });
                    
                    // Update existing orders with current date
                    const currentDate = new Date().toISOString().split('T')[0];
                    db.run(`UPDATE orders SET order_date = ? WHERE order_date IS NULL`, [currentDate], (err) => {
                        if (err) {
                            console.error('Error updating existing orders with order_date:', err);
                        } else {
                            console.log('Updated existing orders with order_date');
                        }
                    });
                });
                
                resolve();
            }
        });
    });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// API Routes for database operations
app.get('/api/clients', (req, res) => {
    db.all('SELECT name, phone FROM clients ORDER BY name', (err, rows) => {
        if (err) {
            console.error('Error fetching clients:', err);
            res.status(500).json({ error: 'Failed to fetch clients' });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/clients', (req, res) => {
    const { name, phone } = req.body;
    db.run('INSERT INTO clients (name, phone) VALUES (?, ?)', [name, phone], function(err) {
        if (err) {
            console.error('Error adding client:', err);
            res.status(500).json({ error: 'Failed to add client' });
        } else {
            res.json({ success: true, id: this.lastID });
        }
    });
});

app.get('/api/orders', (req, res) => {
    const { paid } = req.query;
    let query = 'SELECT * FROM orders';
    let params = [];
    
    if (paid !== undefined) {
        query += ' WHERE paid = ?';
        params.push(paid === 'true');
    }
    
    query += ' ORDER BY id DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ error: 'Failed to fetch orders' });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/orders', (req, res) => {
    const { name, drink, quantity, price_sum } = req.body;
    const orderDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
    db.run('INSERT INTO orders (name, drink, quantity, price_sum, paid, order_date) VALUES (?, ?, ?, ?, ?, ?)', 
           [name, drink, quantity, price_sum, false, orderDate], function(err) {
        if (err) {
            console.error('Error adding order:', err);
            res.status(500).json({ error: 'Failed to add order' });
        } else {
            res.json({ success: true, id: this.lastID });
        }
    });
});

app.put('/api/orders/mark-paid', (req, res) => {
    const paidDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
    db.run('UPDATE orders SET paid = TRUE, paid_date = ? WHERE paid = FALSE', [paidDate], function(err) {
        if (err) {
            console.error('Error marking orders as paid:', err);
            res.status(500).json({ error: 'Failed to mark orders as paid' });
        } else {
            res.json({ success: true, changes: this.changes });
        }
    });
});

app.delete('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;
    console.log(`🔥 DELETE REQUEST RECEIVED for order ID: ${orderId}`);
    console.log(`🔥 Request params:`, req.params);
    console.log(`🔥 Request body:`, req.body);
    
    // First check if the order exists
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, row) => {
        if (err) {
            console.error('❌ Error checking order existence:', err);
            res.status(500).json({ error: 'Failed to check order' });
        } else if (!row) {
            console.log(`❌ Order ID ${orderId} not found in database`);
            res.status(404).json({ error: 'Order not found' });
        } else {
            console.log(`✅ Order found:`, row);
            // Order exists, proceed with deletion
            db.run('DELETE FROM orders WHERE id = ?', [orderId], function(err) {
                if (err) {
                    console.error('❌ Error deleting order:', err);
                    res.status(500).json({ error: 'Failed to delete order' });
                } else {
                    console.log(`✅ Successfully deleted order ID: ${orderId}`);
                    res.json({ success: true, changes: this.changes });
                }
            });
        }
    });
});

// Routes for JSON file updates (for drinks)
app.put('/drinks.json', async (req, res) => {
    try {
        await fs.writeFile('drinks.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating drinks.json:', error);
        res.status(500).json({ error: 'Failed to update drinks.json' });
    }
});

// Initialize database and start server
initializeDatabase().then(() => {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🍺 שרת פאב תובל פועל על פורט ${PORT}`);
        console.log(`🌐 נגיש בכתובת: http://0.0.0.0:${PORT}`);
        console.log(`📊 מסד נתונים SQLite: ${dbPath}`);
        console.log('✅ השרת מוכן לקבלת בקשות');
    });
    
    // Handle server errors
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ שגיאה: פורט ${PORT} כבר בשימוש`);
            console.error('💡 נסה לעצור תהליכים אחרים או שנה את הפורט');
        } else {
            console.error('❌ שגיאת שרת:', err);
        }
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('🛑 מקבל SIGTERM, סוגר את השרת...');
        server.close(() => {
            console.log('✅ השרת נסגר בהצלחה');
            if (db) {
                db.close();
            }
            process.exit(0);
        });
    });
    
}).catch((error) => {
    console.error('❌ שגיאה באתחול מסד הנתונים:', error);
    process.exit(1);
});
