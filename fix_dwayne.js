#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pub_database.db');

console.log('🔧 Fixing username: dwaine → dwayne\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
    
    db.run("UPDATE users SET User_name = 'dwayne' WHERE User_name = 'dwaine'", function(err) {
        if (err) {
            console.error('❌ Error updating user:', err.message);
        } else if (this.changes === 0) {
            console.log('⚠️  User "dwaine" not found - may already be "dwayne"');
        } else {
            console.log('✅ Successfully updated username to "dwayne"');
        }
        
        db.close();
    });
});

