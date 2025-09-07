const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 2000;

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
                            paid BOOLEAN DEFAULT FALSE
                        )
                    `);
                    
                    db.run(`
                        CREATE TABLE IF NOT EXISTS clients (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL UNIQUE,
                            phone TEXT NOT NULL
                        )
                    `);
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
    db.run('INSERT INTO orders (name, drink, quantity, price_sum, paid) VALUES (?, ?, ?, ?, ?)', 
           [name, drink, quantity, price_sum, false], function(err) {
        if (err) {
            console.error('Error adding order:', err);
            res.status(500).json({ error: 'Failed to add order' });
        } else {
            res.json({ success: true, id: this.lastID });
        }
    });
});

app.put('/api/orders/mark-paid', (req, res) => {
    db.run('UPDATE orders SET paid = TRUE WHERE paid = FALSE', function(err) {
        if (err) {
            console.error('Error marking orders as paid:', err);
            res.status(500).json({ error: 'Failed to mark orders as paid' });
        } else {
            res.json({ success: true, changes: this.changes });
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
    app.listen(PORT, () => {
        console.log(`שרת פאב תובל פועל ב-http://localhost:${PORT}`);
        console.log('פתח את הדפדפן שלך ונווט לכתובת למעלה כדי להשתמש באפליקציה.');
        console.log(`מסד נתונים SQLite: ${dbPath}`);
    });
}).catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});
