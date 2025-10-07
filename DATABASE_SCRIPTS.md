# 🍺 Database Management Scripts

## 🌐 Local Application
**Access the pub management app:** [http://localhost:3005](http://localhost:3005)

To start the server:
```bash
npm start
```

## 📋 Available Scripts

### 1. `view_database.js` - Full Database Viewer
Shows complete database content with detailed information.

**Usage:**
```bash
node view_database.js
```

**Shows:**
- All clients with ID, name, and phone
- Last 20 orders with full details
- Summary statistics (total orders, revenue, etc.)

### 2. `quick_db_check.js` - Quick Database Check
Fast overview of database status.

**Usage:**
```bash
node quick_db_check.js
```

**Shows:**
- Client count
- Total orders
- Unpaid orders
- Total revenue
- Last 5 orders

## 🚀 Usage Examples

### Check Database Status
```bash
# Quick overview
node quick_db_check.js

# Full detailed view
node view_database.js
```

### Make Scripts Executable (Optional)
```bash
chmod +x view_database.js
chmod +x quick_db_check.js
```

## 📊 Sample Output

### Quick Check:
```
🍺 Quick DB Check 🍺

👥 Clients: 53
🍺 Total orders: 15
💰 Unpaid orders: 8
💵 Revenue: ₪245.50

📋 Recent Orders:
⏳ ים שמואלי - בירה (2x) - ₪24.00 - 2025-09-07
✅ ליאור שוחט - קולה (1x) - ₪8.00 - 2025-09-07
⏳ מעיין שוחט - מים (1x) - ₪5.00 - 2025-09-07
```

### Full View:
```
🍺 פאב תובל - Database Viewer 🍺

✅ Connected to database successfully

👥 CLIENTS:
==================================================
ID | Name                    | Phone
--------------------------------------------------
 1 | אבירמה                  | N/A
 2 | אדירי                   | N/A
 3 | אייל שמואלי             | N/A
...

🍺 ORDERS:
================================================================================
ID | Name           | Drink        | Qty | Price | Paid | Order Date | Paid Date
--------------------------------------------------------------------------------
15 | ים שמואלי      | בירה         |   2 | 24.00 | No   | 2025-09-07 | N/A
14 | ליאור שוחט     | קולה         |   1 |  8.00 | Yes  | 2025-09-07 | 2025-09-07
...

📊 SUMMARY:
==============================
Total orders: 15
Unpaid orders: 8
Paid orders: 7
Total revenue: ₪245.50
Unpaid amount: ₪156.00
```

## 🔧 Troubleshooting

### Database Not Found
```bash
# Check if database file exists
ls -la pub_database.db

# Check if you're in the right directory
pwd
```

### Permission Issues
```bash
# Make sure you have read access
ls -la pub_database.db
```

### Node.js Not Found
```bash
# Check Node.js installation
node --version
npm --version
```

## 📁 File Locations

- **Database file:** `pub_database.db`
- **Scripts:** `view_database.js`, `quick_db_check.js`
- **Project directory:** `/opt/apps/pub/` (on VPS)
