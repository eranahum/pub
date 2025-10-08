const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3005;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

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
                    
                    db.run(`
                        CREATE TABLE IF NOT EXISTS users (
                            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                            User_name TEXT NOT NULL UNIQUE,
                            Password TEXT NOT NULL
                        )
                    `);
                    
                    db.run(`
                        CREATE TABLE IF NOT EXISTS events (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            event_name TEXT NOT NULL,
                            event_date TEXT NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
                    
                    db.run(`ALTER TABLE orders ADD COLUMN event TEXT`, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            console.error('Error adding event column:', err);
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
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'pub-tuvalu-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 5 * 60 * 60 * 1000, // 5 hours in milliseconds
        httpOnly: true,
        secure: USE_HTTPS, // Enable secure cookies when using HTTPS
        sameSite: USE_HTTPS ? 'strict' : 'lax'
    }
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        // Session is valid
        next();
    } else {
        // No valid session
        res.status(401).json({ error: 'Unauthorized', redirect: '/login.html' });
    }
}

// Serve static files with authentication check for HTML pages (except login.html)
app.use((req, res, next) => {
    const filePath = req.path;
    
    // Allow access to login page and its assets
    if (filePath === '/login.html' || filePath.startsWith('/styles.css') || filePath === '/favicon.ico') {
        return express.static('.')(req, res, next);
    }
    
    // Check authentication for HTML pages
    if (filePath.endsWith('.html') || filePath === '/' || filePath === '/index.html') {
        if (req.session && req.session.userId) {
            return express.static('.')(req, res, next);
        } else {
            return res.redirect('/login.html');
        }
    }
    
    // Allow other static files (JS, CSS, images, etc.)
    express.static('.')(req, res, next);
});

// Authentication Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Query database for user
    db.get('SELECT user_id, User_name FROM users WHERE User_name = ? AND Password = ?', 
           [username, password], (err, user) => {
        if (err) {
            console.error('Error checking credentials:', err);
            return res.status(500).json({ error: 'Server error' });
        }
        
        if (user) {
            // Create session
            req.session.userId = user.user_id;
            req.session.username = user.User_name;
            
            console.log(`✅ User ${user.User_name} logged in successfully`);
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: { id: user.user_id, username: user.User_name }
            });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    });
});

app.post('/api/logout', (req, res) => {
    const username = req.session?.username;
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        console.log(`✅ User ${username} logged out successfully`);
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.get('/api/check-session', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ 
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username
            }
        });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// API Routes for database operations (protected by authentication)
app.get('/api/clients', requireAuth, (req, res) => {
    db.all('SELECT name, phone FROM clients ORDER BY name', (err, rows) => {
        if (err) {
            console.error('Error fetching clients:', err);
            res.status(500).json({ error: 'Failed to fetch clients' });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/clients', requireAuth, (req, res) => {
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

app.get('/api/orders', requireAuth, (req, res) => {
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

app.post('/api/orders', requireAuth, (req, res) => {
    const { name, drink, quantity, price_sum } = req.body;
    const orderDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
    
    // Check if there's an event on the same date
    db.get('SELECT event_name FROM events WHERE event_date = ?', [orderDate], (err, eventRow) => {
        if (err) {
            console.error('Error checking for events:', err);
            // Continue with order creation even if event check fails
        }
        
        const eventName = eventRow ? eventRow.event_name : null;
        
        db.run('INSERT INTO orders (name, drink, quantity, price_sum, paid, order_date, event) VALUES (?, ?, ?, ?, ?, ?, ?)', 
               [name, drink, quantity, price_sum, false, orderDate, eventName], function(err) {
            if (err) {
                console.error('Error adding order:', err);
                res.status(500).json({ error: 'Failed to add order' });
            } else {
                if (eventName) {
                    console.log(`✅ Order added for event: ${eventName}`);
                }
                res.json({ success: true, id: this.lastID, event: eventName });
            }
        });
    });
});

app.put('/api/orders/mark-paid', requireAuth, (req, res) => {
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

app.delete('/api/orders/:id', requireAuth, (req, res) => {
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
app.put('/drinks.json', requireAuth, async (req, res) => {
    try {
        await fs.writeFile('drinks.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating drinks.json:', error);
        res.status(500).json({ error: 'Failed to update drinks.json' });
    }
});

// API Routes for events
app.get('/api/events', requireAuth, (req, res) => {
    db.all('SELECT * FROM events ORDER BY event_date DESC', (err, rows) => {
        if (err) {
            console.error('Error fetching events:', err);
            res.status(500).json({ error: 'Failed to fetch events' });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/events', requireAuth, (req, res) => {
    const { event_name, event_date } = req.body;
    
    if (!event_name || !event_date) {
        return res.status(400).json({ error: 'Event name and date are required' });
    }
    
    db.run('INSERT INTO events (event_name, event_date) VALUES (?, ?)', [event_name, event_date], function(err) {
        if (err) {
            console.error('Error adding event:', err);
            res.status(500).json({ error: 'Failed to add event' });
        } else {
            console.log(`✅ Event added: ${event_name} on ${event_date}`);
            res.json({ success: true, id: this.lastID });
        }
    });
});

// Initialize database and start server
initializeDatabase().then(() => {
    let server;
    
    if (USE_HTTPS) {
        // HTTPS server
        const sslPath = path.join(__dirname, 'ssl');
        const keyPath = path.join(sslPath, 'key.pem');
        const certPath = path.join(sslPath, 'cert.pem');
        
        // Check if SSL certificates exist
        if (!fsSync.existsSync(keyPath) || !fsSync.existsSync(certPath)) {
            console.error('❌ SSL certificates not found!');
            console.error('📁 Expected location: ./ssl/');
            console.error('🔑 Required files: key.pem, cert.pem');
            console.error('💡 Run: npm run generate-cert (for development)');
            console.error('💡 Or use Let\'s Encrypt for production');
            process.exit(1);
        }
        
        const httpsOptions = {
            key: fsSync.readFileSync(keyPath),
            cert: fsSync.readFileSync(certPath)
        };
        
        server = https.createServer(httpsOptions, app);
        server.listen(HTTPS_PORT, '0.0.0.0', () => {
            console.log(`🍺 שרת פאב תובל פועל על פורט ${HTTPS_PORT} (HTTPS)`);
            console.log(`🔒 נגיש בכתובת: https://0.0.0.0:${HTTPS_PORT}`);
            console.log(`📊 מסד נתונים SQLite: ${dbPath}`);
            console.log('✅ השרת מוכן לקבלת בקשות (מאובטח)');
        });
    } else {
        // HTTP server (development)
        server = http.createServer(app);
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🍺 שרת פאב תובל פועל על פורט ${PORT} (HTTP)`);
            console.log(`🌐 נגיש בכתובת: http://0.0.0.0:${PORT}`);
            console.log(`📊 מסד נתונים SQLite: ${dbPath}`);
            console.log('⚠️  מצב פיתוח - לא מאובטח');
            console.log('✅ השרת מוכן לקבלת בקשות');
        });
    }
    
    // Handle server errors
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            const port = USE_HTTPS ? HTTPS_PORT : PORT;
            console.error(`❌ שגיאה: פורט ${port} כבר בשימוש`);
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
