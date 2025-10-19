// --- Global Constants ---
const LS_INVENTORY_KEY = 'inventoryItems';
const LS_LOGGED_IN_USER = 'loggedInUser';
const LS_USERS_KEY = 'users';

// --- DOM Elements ---
const loginForm = document.getElementById('login-form');
const itemForm = document.getElementById('item-form');
const inventoryList = document.getElementById('inventory-list');
const searchInput = document.getElementById('search-input');
const messageArea = document.getElementById('message-area');
const loginView = document.getElementById('login-view');
const inventoryView = document.getElementById('inventory-view');
const authControls = document.getElementById('auth-controls');

// --- Local Storage Utilities ---

/** Initializes default user and empty inventory if they don't exist. */
function initLocalStorage() {
    if (!localStorage.getItem(LS_USERS_KEY)) {
        // Simple default user for demonstration
        const defaultUsers = [{ username: 'admin', password: '123' }]; 
        localStorage.setItem(LS_USERS_KEY, JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem(LS_INVENTORY_KEY)) {
        localStorage.setItem(LS_INVENTORY_KEY, JSON.stringify([]));
    }
}

/** Saves data to Local Storage. */
function saveToLS(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/** Loads and parses data from Local Storage. */
function loadFromLS(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

// --- Message/Alert Utility ---

/** Displays a temporary message to the user. */
function showMessage(message, type) {
    messageArea.textContent = message;
    messageArea.className = ''; // Clear previous classes
    messageArea.classList.add(type);
    messageArea.style.display = 'block';

    setTimeout(() => {
        messageArea.style.display = 'none';
    }, 3000);
}

// --- Authentication Logic ---

/** Handles user login attempt. */
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const users = loadFromLS(LS_USERS_KEY);
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        saveToLS(LS_LOGGED_IN_USER, username);
        renderAppView();
        showMessage(`Welcome back, ${username}!`, 'success');
    } else {
        showMessage('Invalid username or password.', 'error');
    }
}

/** Handles user logout. */
function handleLogout() {
    localStorage.removeItem(LS_LOGGED_IN_USER);
    renderAppView();
    showMessage('Logged out successfully.', 'success');
}

// --- View Rendering (Switching between Login/Inventory) ---

/** Toggles between the login and inventory views based on login status. */
function renderAppView() {
    const loggedInUser = localStorage.getItem(LS_LOGGED_IN_USER);
    
    if (loggedInUser) {
        loginView.classList.add('hidden');
        inventoryView.classList.remove('hidden');
        authControls.classList.remove('hidden');
        document.getElementById('welcome-message').textContent = `Welcome, ${loggedInUser}`;
        renderInventoryTable();
    } else {
        loginView.classList.remove('hidden');
        inventoryView.classList.add('hidden');
        authControls.classList.add('hidden');
    }
    // Clear the form fields
    loginForm.reset();
}

// --- Inventory CRUD Operations ---

/** Adds a new item or updates an existing one based on item-id field. */
function saveItem(event) {
    event.preventDefault();

    const idField = document.getElementById('item-id');
    const name = document.getElementById('item-name').value;
    const quantity = parseInt(document.getElementById('item-quantity').value);
    const price = parseFloat(document.getElementById('item-price').value);

    // Validate inputs (form 'required' handles most of this, but good for custom validation)
    if (quantity < 1 || price <= 0) {
        showMessage('Quantity must be 1+ and Price must be greater than 0.', 'error');
        return;
    }

    let items = loadFromLS(LS_INVENTORY_KEY);
    const id = idField.value;

    if (id) {
        // Update existing item
        const index = items.findIndex(item => item.id == id);
        if (index !== -1) {
            items[index] = { id: parseInt(id), name, quantity, price: price.toFixed(2) };
            showMessage(`Item "${name}" updated successfully!`, 'success');
        }
    } else {
        // Add new item: generate a unique ID
        const newId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
        const newItem = { id: newId, name, quantity, price: price.toFixed(2) };
        items.push(newItem);
        showMessage(`Item "${name}" added successfully!`, 'success');
    }

    saveToLS(LS_INVENTORY_KEY, items);
    
    // Reset form and UI for adding new item
    itemForm.reset();
    idField.value = ''; // Clear hidden ID
    document.getElementById('item-submit-btn').textContent = 'Add Item';
    
    renderInventoryTable();
}

/** Pre-fills the form to edit an item. */
function editItem(id) {
    const items = loadFromLS(LS_INVENTORY_KEY);
    const item = items.find(i => i.id === id);

    if (item) {
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-quantity').value = item.quantity;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-submit-btn').textContent = 'Save Changes';
        // Scroll to the form for better UX
        document.getElementById('inventory-view').scrollIntoView({ behavior: 'smooth' });
    }
}

/** Deletes an item by ID. */
function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    let items = loadFromLS(LS_INVENTORY_KEY);
    const itemToDelete = items.find(item => item.id === id);
    items = items.filter(item => item.id !== id);
    saveToLS(LS_INVENTORY_KEY, items);
    
    showMessage(`Item "${itemToDelete ? itemToDelete.name : ''}" deleted successfully.`, 'success');
    renderInventoryTable();
}

// --- Rendering and Filtering ---

/** Renders the inventory table, optionally filtered by a search term. */
function renderInventoryTable(filterTerm = '') {
    const items = loadFromLS(LS_INVENTORY_KEY);
    inventoryList.innerHTML = ''; // Clear existing rows

    const lowerCaseFilter = filterTerm.toLowerCase();
    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(lowerCaseFilter) ||
        String(item.id).includes(lowerCaseFilter)
    );

    filteredItems.forEach(item => {
        const row = inventoryList.insertRow();
        
        row.insertCell(0).textContent = item.id;
        row.insertCell(1).textContent = item.name;
        row.insertCell(2).textContent = item.quantity;
        row.insertCell(3).textContent = `$${parseFloat(item.price).toFixed(2)}`;
        
        const actionsCell = row.insertCell(4);
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editItem(item.id);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('btn-danger');
        deleteBtn.onclick = () => deleteItem(item.id);

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

// --- Data Export Feature ---

/** Downloads the inventory data as a JSON file. */
function downloadInventoryData() {
    const data = loadFromLS(LS_INVENTORY_KEY);
    if (data.length === 0) {
        showMessage('No items to download.', 'error');
        return;
    }

    // 1. Convert the JavaScript object array to a formatted JSON string
    const jsonString = JSON.stringify(data, null, 2); 

    // 2. Create a Blob object for the browser to handle
    const blob = new Blob([jsonString], { type: 'application/json' });

    // 3. Create a temporary download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_backup_${new Date().toISOString().slice(0, 10)}.json`; // Dynamic filename
    
    // 4. Trigger the download
    document.body.appendChild(a); 
    a.click();
    
    // 5. Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url); 
    
    showMessage('Inventory data downloaded successfully!', 'success');
}


// --- Event Listeners and Initialization ---

// Attach event listeners
loginForm.addEventListener('submit', handleLogin);
itemForm.addEventListener('submit', saveItem);
searchInput.addEventListener('input', (e) => renderInventoryTable(e.target.value));

// Initialization function run when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initLocalStorage();
    renderAppView();
});