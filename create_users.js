#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'pub_database.db');

console.log('🍺 Creating Users in Database...\n');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database successfully\n');
});

// Users to add
const users = [
    { username: 'dwaine', password: '123' },
    { username: 'shimon', password: '123' },
    { username: 'eran', password: '123' },
    { username: 'dana', password: '123' },
    { username: 'oran', password: '123' },
    { username: 'eilon', password: '123' }
];

// Insert users
const insertUser = (username, password) => {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO users (User_name, Password) VALUES (?, ?)', [username, password], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    console.log(`⚠️  User ${username} already exists - skipping`);
                    resolve(null);
                } else {
                    console.error(`❌ Error adding user ${username}:`, err.message);
                    reject(err);
                }
            } else {
                console.log(`✅ Added user: ${username} (ID: ${this.lastID})`);
                resolve(this.lastID);
            }
        });
    });
};

// Main function
async function main() {
    try {
        for (const user of users) {
            await insertUser(user.username, user.password);
        }
        
        console.log('\n✅ User creation complete!');
        
        // Show all users
        db.all('SELECT user_id, User_name FROM users ORDER BY user_id', (err, rows) => {
            if (err) {
                console.error('❌ Error fetching users:', err.message);
            } else {
                console.log('\n👤 Current users in database:');
                console.log('='.repeat(40));
                if (rows.length === 0) {
                    console.log('No users found.');
                } else {
                    rows.forEach(row => {
                        console.log(`${row.user_id}. ${row.User_name}`);
                    });
                    console.log(`\nTotal users: ${rows.length}`);
                }
            }
            
            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('\n🔒 Database connection closed.');
                }
            });
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
        db.close();
        process.exit(1);
    }
}

// Run the script
main();

