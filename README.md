# פאב תובל - אפליקציית אינטרנט

אפליקציית אינטרנט לפאב מקומי לניהול הזמנות, לקוחות ומשקאות. האפליקציה מאפשרת ללקוחות להזמין משקאות, עוקבת אחר הזמנות לא משולמות, ומספקת פונקציונליות ניהול עבור לקוחות ומשקאות.

## Features

### 🏠 Homepage - Order Drinks
- Large "Our Pub" headline
- Start Order button with client selection dropdown
- Live search/filtering of client names
- Drink selection dropdown with prices
- Quantity controls (+ / - buttons)
- Send order functionality with SQLite storage

### 💰 Payout Page - Export Unpaid Orders
- Generate payout report button
- Groups unpaid orders by client name
- Exports data as CSV file
- Marks all orders as paid after export

### ➕ Register Page - Add New Clients
- Registration form with name and phone fields
- Validates inputs and prevents duplicate names
- Updates clients.json file

### 🍹 Drinks Page - Manage Menu
- Display drinks in a table format
- Add new drinks with name and price
- Edit existing drinks inline
- Validates drink names (unique, non-empty) and prices (positive numbers)

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: SQLite (server-side database file)
- **Storage**: JSON files for drinks data, SQLite for clients and orders
- **Styling**: Responsive design with desert brown theme
- **Backend**: Express.js server with REST API

## Installation & Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3005`

## File Structure

```
pub/
├── index.html          # Main HTML file
├── styles.css          # CSS styles with responsive design
├── app.js             # Main JavaScript application
├── server.js          # Express.js server with REST API
├── package.json       # Node.js dependencies
├── pub_database.db    # SQLite database (created on first run)
├── clients.json       # Client data (backup/migration)
├── drinks.json        # Drinks menu data
├── .gitignore         # Git ignore file
└── README.md          # This file
```

## Database Schema

The application uses SQLite with the following table structure:

### orders Table
| Column    | Type    | Description                    |
|-----------|---------|--------------------------------|
| id        | INT     | Auto-increment primary key     |
| name      | TEXT    | Client's name                  |
| drink     | TEXT    | Ordered drink                  |
| quantity  | INT     | Number of drinks               |
| price_sum | REAL    | Total price = drink × quantity |
| paid      | BOOLEAN | false by default               |

### clients Table
| Column    | Type    | Description                    |
|-----------|---------|--------------------------------|
| id        | INT     | Auto-increment primary key     |
| name      | TEXT    | Client's name (unique)         |
| phone     | TEXT    | Client's phone number          |

## Usage

1. **Adding Clients**: Use the Register page to add new clients
2. **Managing Drinks**: Use the Drinks page to add, edit, or view the drink menu
3. **Taking Orders**: Use the Homepage to select clients, choose drinks, set quantities, and send orders
4. **Generating Reports**: Use the Payout page to generate and export unpaid order summaries

## Features

- ✅ Fully responsive design for mobile/tablet use
- ✅ SQLite database for order persistence
- ✅ JSON files for client and drink data
- ✅ No authentication required
- ✅ Robust file operations with error handling
- ✅ CSV export functionality
- ✅ Real-time search and filtering
- ✅ Input validation and duplicate prevention

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Notes

- The application stores data locally in the browser's localStorage for the SQLite database
- JSON files are updated via the Express.js server
- All data persists between browser sessions
- The application works offline once initially loaded
