// Global variables
let clients = [];
let drinks = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    await addNewClients(); // Add the new client list
    setupNavigation();
    loadPage();
});

// API functions for server communication
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Load data from server
async function loadData() {
    try {
        // Load clients from server API
        clients = await apiRequest('/api/clients');
        
        // Load drinks from JSON file
        const drinksResponse = await fetch('drinks.json');
        drinks = await drinksResponse.json();
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('שגיאה בטעינת קבצי הנתונים. אנא ודא שהשרת פועל.', 'error');
    }
}

// Add new clients to the database
async function addNewClients() {
    try {
        // Check if clients already exist in database
        const existingClients = await apiRequest('/api/clients');
        
        if (existingClients.length > 0) {
            console.log(`Database already has ${existingClients.length} clients. Skipping client addition.`);
            clients = existingClients;
            return;
        }
        
        const newClients = [
            'אייל שמואלי', 'ים שמואלי', 'ליאור שוחט', 'מעיין שוחט', 'טל שניצר', 'שמעון שניצר',
            'גל אנגדיה', 'ניצן ארז', 'אסף לאופר', 'איתי ביי', 'רועי בן נון', 'רז בן נון',
            'רעי כורכוס', 'אבירמה', 'צביקה לקח', 'חן פראן', 'סופי אסקייב', 'יוני שטיין',
            'דפנה כהן', 'אמיתי ווינמן', 'דניאל בן דב', 'שי בן דב', 'הרעוז', 'ארגוב',
            'גרשון איסקייב', 'עמיחי שדה', 'אדירי', 'הראל טהורלב', 'אלה טהורלב', 'איילת שחר',
            'איילת כץ', 'יגאל נימני', 'ערן נחום', 'שיר רגב', 'שולטי רגב', 'דוואין',
            'גיא טנא', 'מרינה פתחוב', 'נאור', 'רוסלאן חכם', 'דנה גולן', 'גילי אדרי',
            'רבקה אפרתי', 'אילון כלב', 'ניסים מור', 'מילנר', 'רויטל תמרי', 'בנטוב',
            'בוצ\'אצ\'', 'אנטון סלוצקר', 'ניל מרסר', 'סוניה אביניצר', 'שלומי סניור'
        ];
        
        let addedCount = 0;
        for (const name of newClients) {
            try {
                await apiRequest('/api/clients', {
                    method: 'POST',
                    body: JSON.stringify({ name, phone: '' })
                });
                addedCount++;
            } catch (e) {
                // Ignore if already exists
                console.log(`Client ${name} already exists, skipping...`);
            }
        }
        
        if (addedCount > 0) {
            // Reload clients from server
            clients = await apiRequest('/api/clients');
            console.log(`Added ${addedCount} new clients to the database`);
        }
    } catch (error) {
        console.error('Error in addNewClients:', error);
        // Fallback: try to load existing clients
        try {
            clients = await apiRequest('/api/clients');
            console.log(`Loaded ${clients.length} existing clients from database`);
        } catch (e) {
            console.error('Failed to load clients from database');
        }
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const bottomNavLinks = document.querySelectorAll('.bottom-nav-link');
    
    // Handle main navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('href').substring(1);
            loadPage(page);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            bottomNavLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Handle bottom navigation
    bottomNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('href').substring(1);
            loadPage(page);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            bottomNavLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Load page content
function loadPage(page = '') {
    const mainContent = document.getElementById('main-content');
    
    switch (page) {
        case 'payout':
            checkPayoutPassword();
            break;
        case 'register':
            loadRegisterPage();
            break;
        case 'drinks':
            loadDrinksPage();
            break;
        default:
            loadHomePage();
    }
}

// Homepage functionality
function loadHomePage() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="order-section">
            <div class="dropdown-container" id="client-dropdown-container">
                <input type="text" class="search-input" id="client-search" placeholder="חפש לקוחות..." onkeyup="filterClients()" onclick="showClientDropdownOnClick()">
                <div class="dropdown" id="client-dropdown"></div>
            </div>
            
            <div class="drink-selection" id="drink-selection" style="display: none;">
                <select class="drink-dropdown" id="drink-dropdown" onchange="showQuantityControls()">
                    <option value="">בחר משקה</option>
                </select>
                
                <div class="quantity-controls" id="quantity-controls" style="display: none;">
                    <button class="quantity-btn" onclick="decreaseQuantity()">-</button>
                    <span class="quantity-display" id="quantity-display">1</span>
                    <button class="quantity-btn" onclick="increaseQuantity()">+</button>
                </div>
                
                <button class="send-order-btn" onclick="sendOrder()" style="display: none;">שלח הזמנה</button>
            </div>
        </div>
    `;
    
    // Automatically show client dropdown when home page loads
    showClientDropdown();
}

function showClientDropdown() {
    const container = document.getElementById('client-dropdown-container');
    const dropdown = document.getElementById('client-dropdown');
    
    container.style.display = 'block';
    populateClientDropdown();
}

function populateClientDropdown() {
    const dropdown = document.getElementById('client-dropdown');
    dropdown.innerHTML = '';
    
    clients.forEach(client => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = client.name;
        item.onclick = () => selectClient(client.name);
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

function filterClients() {
    const searchTerm = document.getElementById('client-search').value.toLowerCase();
    const items = document.querySelectorAll('.dropdown-item');
    
    items.forEach(item => {
        const name = item.textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function selectClient(clientName) {
    document.getElementById('client-search').value = clientName;
    document.getElementById('client-dropdown').style.display = 'none';
    
    // Show drink selection
    const drinkSelection = document.getElementById('drink-selection');
    const drinkDropdown = document.getElementById('drink-dropdown');
    
    drinkSelection.style.display = 'block';
    drinkDropdown.innerHTML = '<option value="">בחר משקה</option>';
    
    drinks.forEach(drink => {
        const option = document.createElement('option');
        option.value = drink.name;
        option.textContent = `${drink.name} - ₪${drink.price}`;
        option.dataset.price = drink.price;
        drinkDropdown.appendChild(option);
    });
}

// Show client dropdown when user clicks on search input
function showClientDropdownOnClick() {
    const dropdown = document.getElementById('client-dropdown');
    if (dropdown) {
        populateClientDropdown();
        dropdown.style.display = 'block';
    }
}

function showQuantityControls() {
    const drinkDropdown = document.getElementById('drink-dropdown');
    const quantityControls = document.getElementById('quantity-controls');
    const sendBtn = document.querySelector('.send-order-btn');
    
    if (drinkDropdown.value) {
        quantityControls.style.display = 'flex';
        sendBtn.style.display = 'block';
        document.getElementById('quantity-display').textContent = '1';
    } else {
        quantityControls.style.display = 'none';
        sendBtn.style.display = 'none';
    }
}

let currentQuantity = 1;

function increaseQuantity() {
    currentQuantity++;
    document.getElementById('quantity-display').textContent = currentQuantity;
}

function decreaseQuantity() {
    if (currentQuantity > 1) {
        currentQuantity--;
        document.getElementById('quantity-display').textContent = currentQuantity;
    }
}

async function sendOrder() {
    const clientName = document.getElementById('client-search').value;
    const drinkName = document.getElementById('drink-dropdown').value;
    const drinkOption = document.getElementById('drink-dropdown').selectedOptions[0];
    const price = parseFloat(drinkOption.dataset.price);
    
    if (!clientName || !drinkName) {
        showMessage('אנא בחר לקוח ומשקה.', 'error');
        return;
    }
    
    const priceSum = price * currentQuantity;
    
    try {
        await apiRequest('/api/orders', {
            method: 'POST',
            body: JSON.stringify({
                name: clientName,
                drink: drinkName,
                quantity: currentQuantity,
                price_sum: priceSum
            })
        });
        
        showMessage(`הזמנה נשלחה: ${currentQuantity}x ${drinkName} עבור ${clientName} - ₪${priceSum}`, 'success', true);
        
        // Reset form and prepare for next order
        resetOrderForm();
    } catch (error) {
        console.error('Error saving order:', error);
        showMessage('שגיאה בשמירת ההזמנה. אנא נסה שוב.', 'error');
    }
}

// Password protection for payout page
function checkPayoutPassword() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="payout-section">
            <h2>דוח תשלום</h2>
            <div class="password-form">
                <label for="payout-password">הכנס סיסמה:</label>
                <input type="password" id="payout-password" placeholder="סיסמה" required>
                <button class="generate-report-btn" onclick="verifyPayoutPassword()">התחבר</button>
            </div>
            <div class="report-display" id="report-display"></div>
        </div>
    `;
}

function verifyPayoutPassword() {
    const password = document.getElementById('payout-password').value;
    if (password === 'tuvalu') {
        loadPayoutPage();
    } else {
        showMessage('סיסמה שגויה. אנא נסה שוב.', 'error');
    }
}

// Payout page functionality
async function loadPayoutPage() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="payout-section">
            <h2>דוח תשלום</h2>
            <div class="payout-buttons">
                <button class="generate-report-btn" onclick="generatePayoutReport()">צור דוח תשלום</button>
                <button class="delete-order-btn" onclick="showDeleteOrderForm()">מחק הזמנה</button>
                <button class="client-report-btn" onclick="showClientReportForm()">דוח לקוח</button>
            </div>
            <div class="delete-order-form" id="delete-order-form" style="display: none;">
                <div class="form-group">
                    <label for="order-id-input">מזהה הזמנה:</label>
                    <input type="number" id="order-id-input" placeholder="הזן מזהה הזמנה">
                </div>
                <div class="form-buttons">
                    <button class="confirm-delete-btn" onclick="showDeleteConfirmation()">מחק</button>
                    <button class="cancel-delete-btn" onclick="hideDeleteOrderForm()">ביטול</button>
                </div>
                <div class="delete-confirmation" id="delete-confirmation" style="display: none;">
                    <p>האם אתה בטוח שברצונך למחוק הזמנה מספר <span id="order-id-display"></span>?</p>
                    <div class="form-buttons">
                        <button class="final-delete-btn" onclick="finalDeleteOrder()">כן, מחק</button>
                        <button class="cancel-final-btn" onclick="hideDeleteConfirmation()">לא, ביטול</button>
                    </div>
                </div>
            </div>
            <div class="client-report-form" id="client-report-form" style="display: none;">
                <div class="form-group">
                    <label for="client-search-input">חיפוש לקוח:</label>
                    <input type="text" id="client-search-input" placeholder="הזן שם לקוח" oninput="filterClientsForReport()" onclick="showAllClientsForReport()">
                    <div class="dropdown" id="client-dropdown-report" style="display: none;">
                        <!-- Client options will be populated here -->
                    </div>
                </div>
                <div class="form-buttons">
                    <button class="generate-client-report-btn" onclick="generateClientReport()">צור דוח לקוח</button>
                    <button class="cancel-client-report-btn" onclick="hideClientReportForm()">ביטול</button>
                </div>
            </div>
            <div class="unpaid-orders-display" id="unpaid-orders-display"></div>
            <div class="client-orders-display" id="client-orders-display"></div>
            <div class="report-display" id="report-display"></div>
        </div>
    `;
    
    // Load and display unpaid orders
    await loadUnpaidOrders();
}

async function loadUnpaidOrders() {
    try {
        console.log('Loading unpaid orders...');
        const orders = await apiRequest('/api/orders?paid=false');
        console.log('Unpaid orders found:', orders.length);
        
        const unpaidOrdersDisplay = document.getElementById('unpaid-orders-display');
        
        if (orders.length === 0) {
            console.log('No unpaid orders, showing empty message');
            unpaidOrdersDisplay.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">אין הזמנות לא משולמות</p>';
            return;
        }
        
        let ordersHtml = `
            <h3>הזמנות לא משולמות (${orders.length})</h3>
            <div class="orders-table-container">
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>מזהה</th>
                            <th>שם לקוח</th>
                            <th>משקה</th>
                            <th>כמות</th>
                            <th>מחיר</th>
                            <th>תאריך הזמנה</th>
                            <th>סטטוס</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        orders.forEach(order => {
            const orderDate = order.order_date ? new Date(order.order_date).toLocaleDateString('he-IL') : 'לא זמין';
            ordersHtml += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.name}</td>
                    <td>${order.drink}</td>
                    <td>${order.quantity}</td>
                    <td>₪${order.price_sum}</td>
                    <td>${orderDate}</td>
                    <td><span class="status-unpaid">לא שולם</span></td>
                </tr>
            `;
        });
        
        ordersHtml += `
                    </tbody>
                </table>
            </div>
        `;
        
        unpaidOrdersDisplay.innerHTML = ordersHtml;
        
    } catch (error) {
        console.error('Error loading unpaid orders:', error);
        showMessage('שגיאה בטעינת ההזמנות הלא משולמות.', 'error');
    }
}

function showDeleteOrderForm() {
    const deleteForm = document.getElementById('delete-order-form');
    deleteForm.style.display = 'block';
    document.getElementById('order-id-input').focus();
}

function hideDeleteOrderForm() {
    const deleteForm = document.getElementById('delete-order-form');
    deleteForm.style.display = 'none';
    document.getElementById('order-id-input').value = '';
    hideDeleteConfirmation();
}

function showDeleteConfirmation() {
    const orderId = document.getElementById('order-id-input').value.trim();
    
    if (!orderId) {
        showMessage('אנא הזן מזהה הזמנה תקין.', 'error');
        return;
    }
    
    // Show confirmation dialog
    document.getElementById('order-id-display').textContent = orderId;
    document.getElementById('delete-confirmation').style.display = 'block';
}

function hideDeleteConfirmation() {
    document.getElementById('delete-confirmation').style.display = 'none';
}

function finalDeleteOrder() {
    const orderId = document.getElementById('order-id-input').value.trim();
    deleteOrder(orderId);
    hideDeleteOrderForm();
}

async function deleteOrder(orderId) {
    try {
        console.log(`Client: Attempting to delete order ID: ${orderId}`);
        const response = await apiRequest(`/api/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        console.log('Client: Delete response:', response);
        
        if (response.success) {
            showMessage(`הזמנה מספר ${orderId} נמחקה בהצלחה.`, 'success');
            // Reload the unpaid orders to update the display
            await loadUnpaidOrders();
        } else {
            showMessage('שגיאה במחיקת ההזמנה.', 'error');
        }
    } catch (error) {
        console.error('Client: Error deleting order:', error);
        if (error.message.includes('404')) {
            showMessage(`הזמנה מספר ${orderId} לא נמצאה.`, 'error');
        } else {
            showMessage('שגיאה במחיקת ההזמנה. אנא נסה שוב.', 'error');
        }
    }
}

async function generatePayoutReport() {
    try {
        const orders = await apiRequest('/api/orders?paid=false');
        
        if (orders.length === 0) {
            showMessage('לא נמצאו הזמנות לא משולמות.', 'success');
            return;
        }
        
        // Group orders by name and sum totals
        const groupedOrders = {};
        orders.forEach(order => {
            if (!groupedOrders[order.name]) {
                groupedOrders[order.name] = 0;
            }
            groupedOrders[order.name] += order.price_sum;
        });
        
        let csvContent = 'שם,טלפון,סכום,תאריך הזמנה,תאריך תשלום\n';
        let reportHtml = '<h3>דוח תשלום</h3><table class="drinks-table"><tr><th>שם</th><th>טלפון</th><th>סכום</th><th>תאריך הזמנה</th><th>תאריך תשלום</th></tr>';
        
        // Get current date for paid date
        const currentDate = new Date().toLocaleDateString('he-IL');
        
        Object.entries(groupedOrders).forEach(([name, total]) => {
            // Find client phone number
            const client = clients.find(c => c.name === name);
            const phone = client ? client.phone : '';
            
            // Find the most recent order date for this client
            const clientOrders = orders.filter(o => o.name === name);
            const orderDate = clientOrders.length > 0 ? clientOrders[0].order_date : '';
            
            csvContent += `${name},${phone},${total},${orderDate},${currentDate}\n`;
            reportHtml += `<tr><td>${name}</td><td>${phone}</td><td>₪${total}</td><td>${orderDate}</td><td>${currentDate}</td></tr>`;
        });
        
        reportHtml += '</table>';
        
        // Mark orders as paid
        const markPaidResponse = await apiRequest('/api/orders/mark-paid', { method: 'PUT' });
        console.log('Mark paid response:', markPaidResponse);
        
        // Display report
        const reportDisplay = document.getElementById('report-display');
        reportDisplay.innerHTML = reportHtml;
        reportDisplay.style.display = 'block';
        
        // Download CSV
        downloadCSV(csvContent, 'doh-tashlum.csv');
        
        // Wait a moment for database update to complete, then refresh unpaid orders display
        setTimeout(async () => {
            console.log('Refreshing unpaid orders after payment...');
            await loadUnpaidOrders();
        }, 500);
        
        showMessage('דוח תשלום נוצר וההזמנות סומנו כמשולמות.', 'success');
    } catch (error) {
        console.error('Error generating payout report:', error);
        showMessage('שגיאה ביצירת דוח התשלום. אנא נסה שוב.', 'error');
    }
}

function downloadCSV(content, filename) {
    // Add UTF-8 BOM for proper Hebrew display in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Register page functionality
function loadRegisterPage() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="register-section">
            <h2>רישום לקוח חדש</h2>
            <form class="register-form" onsubmit="addClient(event)">
                <div class="form-group">
                    <label for="client-name">שם:</label>
                    <input type="text" id="client-name" required>
                </div>
                <div class="form-group">
                    <label for="client-phone">מספר טלפון:</label>
                    <input type="tel" id="client-phone" required>
                </div>
                <button type="submit" class="add-client-btn">הוסף לקוח</button>
            </form>
        </div>
    `;
}

async function addClient(event) {
    event.preventDefault();
    
    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    
    if (!name || !phone) {
        showMessage('אנא מלא את כל השדות.', 'error');
        return;
    }
    
    // Check for duplicate names (case-insensitive)
    const existingClient = clients.find(client => 
        client.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingClient) {
        showMessage('לקוח עם שם זה כבר קיים.', 'error');
        return;
    }
    
    try {
        // Add to server database
        await apiRequest('/api/clients', {
            method: 'POST',
            body: JSON.stringify({ name, phone })
        });
        
        // Reload clients from server
        clients = await apiRequest('/api/clients');
        
        showMessage(`לקוח "${name}" נוסף בהצלחה!`, 'success');
        
        // Reset form
        document.getElementById('client-name').value = '';
        document.getElementById('client-phone').value = '';
    } catch (error) {
        console.error('Error adding client:', error);
        showMessage('שגיאה בהוספת הלקוח. אנא נסה שוב.', 'error');
    }
}

// Drinks page functionality
function loadDrinksPage() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="drinks-section">
            <h2>ניהול משקאות</h2>
            <button class="add-drink-btn" onclick="showAddDrinkForm()">+ הוסף משקה</button>
            <div class="drink-form" id="add-drink-form" style="display: none;">
                <input type="text" id="new-drink-name" placeholder="שם המשקה" required>
                <input type="number" id="new-drink-price" placeholder="מחיר" step="0.01" min="0" required>
                <button class="save-btn" onclick="addDrink()">שמור</button>
                <button class="cancel-btn" onclick="hideAddDrinkForm()">ביטול</button>
            </div>
            <div id="drinks-table-container"></div>
        </div>
    `;
    
    displayDrinks();
}

function showAddDrinkForm() {
    document.getElementById('add-drink-form').style.display = 'flex';
    document.getElementById('new-drink-name').focus();
}

function hideAddDrinkForm() {
    document.getElementById('add-drink-form').style.display = 'none';
    document.getElementById('new-drink-name').value = '';
    document.getElementById('new-drink-price').value = '';
}

async function addDrink() {
    const name = document.getElementById('new-drink-name').value.trim();
    const price = parseFloat(document.getElementById('new-drink-price').value);
    
    if (!name || isNaN(price) || price <= 0) {
        showMessage('אנא הכנס שם תקין ומחיר חיובי.', 'error');
        return;
    }
    
    // Check for duplicate names (case-insensitive)
    const existingDrink = drinks.find(drink => 
        drink.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingDrink) {
        showMessage('משקה עם שם זה כבר קיים.', 'error');
        return;
    }
    
    try {
        // Add to drinks array
        drinks.push({ name, price });
        
        // Update drinks.json
        await fetch('drinks.json', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(drinks)
        }).catch(() => {
            // If PUT fails, we'll handle it gracefully
            console.log('Could not update drinks.json file directly');
        });
        
        showMessage(`משקה "${name}" נוסף בהצלחה!`, 'success');
        
        // Reset form and refresh display
        hideAddDrinkForm();
        displayDrinks();
    } catch (error) {
        console.error('Error adding drink:', error);
        showMessage('שגיאה בהוספת המשקה. אנא נסה שוב.', 'error');
    }
}

function displayDrinks() {
    const container = document.getElementById('drinks-table-container');
    
    if (drinks.length === 0) {
        container.innerHTML = '<p>אין משקאות זמינים. הוסף כמה משקאות כדי להתחיל!</p>';
        return;
    }
    
    let html = `
        <table class="drinks-table">
            <thead>
                <tr>
                    <th>משקה</th>
                    <th>מחיר</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    drinks.forEach((drink, index) => {
        html += `
            <tr id="drink-row-${index}">
                <td>${drink.name}</td>
                <td>₪${drink.price}</td>
                <td>
                    <button class="edit-btn" onclick="editDrink(${index})">ערוך</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function editDrink(index) {
    const row = document.getElementById(`drink-row-${index}`);
    const drink = drinks[index];
    
    row.innerHTML = `
        <td><input type="text" id="edit-name-${index}" value="${drink.name}" required></td>
        <td><input type="number" id="edit-price-${index}" value="${drink.price}" step="0.01" min="0" required></td>
        <td>
            <button class="save-btn" onclick="saveDrink(${index})">שמור</button>
            <button class="cancel-btn" onclick="cancelEditDrink(${index})">ביטול</button>
        </td>
    `;
}

async function saveDrink(index) {
    const name = document.getElementById(`edit-name-${index}`).value.trim();
    const price = parseFloat(document.getElementById(`edit-price-${index}`).value);
    
    if (!name || isNaN(price) || price <= 0) {
        showMessage('אנא הכנס שם תקין ומחיר חיובי.', 'error');
        return;
    }
    
    // Check for duplicate names (case-insensitive, excluding current drink)
    const existingDrink = drinks.find((drink, i) => 
        i !== index && drink.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingDrink) {
        showMessage('משקה עם שם זה כבר קיים.', 'error');
        return;
    }
    
    try {
        // Update drinks array
        drinks[index] = { name, price };
        
        // Update drinks.json
        await fetch('drinks.json', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(drinks)
        }).catch(() => {
            // If PUT fails, we'll handle it gracefully
            console.log('Could not update drinks.json file directly');
        });
        
        showMessage(`משקה "${name}" עודכן בהצלחה!`, 'success');
        displayDrinks();
    } catch (error) {
        console.error('Error updating drink:', error);
        showMessage('שגיאה בעדכון המשקה. אנא נסה שוב.', 'error');
    }
}

function cancelEditDrink(index) {
    displayDrinks();
}

// Reset order form for next order
function resetOrderForm() {
    // Clear all form fields
    document.getElementById('client-search').value = '';
    document.getElementById('drink-dropdown').value = '';
    
    // Hide drink selection and quantity controls
    document.getElementById('drink-selection').style.display = 'none';
    document.getElementById('quantity-controls').style.display = 'none';
    document.querySelector('.send-order-btn').style.display = 'none';
    
    // Reset quantity
    currentQuantity = 1;
    document.getElementById('quantity-display').textContent = '1';
    
    // Show client dropdown and populate it
    showClientDropdown();
}

// Utility functions
function showMessage(message, type, persistent = false) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of main content, or at the top of body if main content doesn't exist yet
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.insertBefore(messageDiv, mainContent.firstChild);
    } else {
        // If main content doesn't exist yet, add to body temporarily
        document.body.appendChild(messageDiv);
        // Move to main content when it becomes available
        const observer = new MutationObserver(() => {
            const newMainContent = document.getElementById('main-content');
            if (newMainContent && messageDiv.parentNode === document.body) {
                newMainContent.insertBefore(messageDiv, newMainContent.firstChild);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // Auto-remove after 5 seconds only if not persistent
    if (!persistent) {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Client report functionality
function showClientReportForm() {
    const form = document.getElementById('client-report-form');
    form.style.display = 'block';
    
    // Load clients for the dropdown and show them immediately
    loadClientsForReport().then(() => {
        showAllClientsForReport();
    });
}

function hideClientReportForm() {
    const form = document.getElementById('client-report-form');
    form.style.display = 'none';
    
    // Clear the search input and dropdown
    document.getElementById('client-search-input').value = '';
    document.getElementById('client-dropdown-report').style.display = 'none';
    document.getElementById('client-orders-display').innerHTML = '';
}

async function loadClientsForReport() {
    try {
        const clientsData = await apiRequest('/api/clients');
        window.clientsForReport = clientsData;
        return clientsData;
    } catch (error) {
        console.error('Error loading clients for report:', error);
        showMessage('שגיאה בטעינת רשימת הלקוחות.', 'error');
        return [];
    }
}

function showAllClientsForReport() {
    const dropdown = document.getElementById('client-dropdown-report');
    
    if (!window.clientsForReport || window.clientsForReport.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = window.clientsForReport.map(client => 
        `<div class="dropdown-item" onclick="selectClientForReport('${client.name}')">${client.name}</div>`
    ).join('');
    
    dropdown.style.display = 'block';
}

function filterClientsForReport() {
    const searchTerm = document.getElementById('client-search-input').value.toLowerCase();
    const dropdown = document.getElementById('client-dropdown-report');
    
    if (!window.clientsForReport) {
        dropdown.style.display = 'none';
        return;
    }
    
    if (searchTerm.length < 1) {
        // Show all clients when search is empty
        showAllClientsForReport();
        return;
    }
    
    const filteredClients = window.clientsForReport.filter(client => 
        client.name.toLowerCase().includes(searchTerm)
    );
    
    if (filteredClients.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = filteredClients.map(client => 
        `<div class="dropdown-item" onclick="selectClientForReport('${client.name}')">${client.name}</div>`
    ).join('');
    
    dropdown.style.display = 'block';
}

function selectClientForReport(clientName) {
    document.getElementById('client-search-input').value = clientName;
    document.getElementById('client-dropdown-report').style.display = 'none';
}

async function generateClientReport() {
    const clientName = document.getElementById('client-search-input').value.trim();
    
    if (!clientName) {
        showMessage('אנא בחר לקוח.', 'error');
        return;
    }
    
    try {
        const orders = await apiRequest('/api/orders');
        const clientOrders = orders.filter(order => order.name === clientName);
        
        if (clientOrders.length === 0) {
            showMessage(`לא נמצאו הזמנות עבור ${clientName}.`, 'success');
            document.getElementById('client-orders-display').innerHTML = '';
            return;
        }
        
        // Sort orders by date (newest first)
        clientOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
        
        let reportHtml = `
            <h3>דוח הזמנות עבור ${clientName}</h3>
            <div class="orders-table-container">
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>מזהה</th>
                            <th>שם</th>
                            <th>משקה</th>
                            <th>כמות</th>
                            <th>מחיר</th>
                            <th>סטטוס</th>
                            <th>תאריך הזמנה</th>
                            <th>תאריך תשלום</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        let totalAmount = 0;
        let paidAmount = 0;
        
        clientOrders.forEach(order => {
            const paidStatus = order.paid ? 'שולם' : 'לא שולם';
            const paidDate = order.paid_date || '-';
            const orderDate = order.order_date || '-';
            
            totalAmount += order.price_sum;
            if (order.paid) {
                paidAmount += order.price_sum;
            }
            
            reportHtml += `
                <tr class="${order.paid ? 'status-paid' : 'status-unpaid'}">
                    <td>${order.id}</td>
                    <td>${order.name}</td>
                    <td>${order.drink}</td>
                    <td>${order.quantity}</td>
                    <td>₪${order.price_sum}</td>
                    <td>${paidStatus}</td>
                    <td>${orderDate}</td>
                    <td>${paidDate}</td>
                </tr>
            `;
        });
        
        reportHtml += `
                    </tbody>
                </table>
            </div>
            <div class="client-summary">
                <h4>סיכום:</h4>
                <p><strong>סה"כ הזמנות:</strong> ${clientOrders.length}</p>
                <p><strong>סכום כולל:</strong> ₪${totalAmount}</p>
                <p><strong>סכום שולם:</strong> ₪${paidAmount}</p>
                <p><strong>סכום חוב:</strong> ₪${totalAmount - paidAmount}</p>
            </div>
        `;
        
        document.getElementById('client-orders-display').innerHTML = reportHtml;
        showMessage(`דוח לקוח נוצר בהצלחה עבור ${clientName}.`, 'success');
        
    } catch (error) {
        console.error('Error generating client report:', error);
        showMessage('שגיאה ביצירת דוח הלקוח.', 'error');
    }
}
