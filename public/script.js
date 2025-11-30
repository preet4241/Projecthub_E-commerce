let cart = [];
let allProjects = [];
let favorites = [];
let isBanFilterActive = false;

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when link is clicked
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Search button handler
    document.getElementById('searchBtn').addEventListener('click', () => {
        openSearch();
    });

    // Search input handler with real-time suggestions
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        // Check for secret admin code
        if (query === '@hackerponline') {
            closeSearch();
            showAdminLogin();
            return;
        }
        
        if (query.length > 0) {
            const suggestions = allProjects.filter(project =>
                project.topic.toLowerCase().includes(query) ||
                project.subject.toLowerCase().includes(query) ||
                project.college.toLowerCase().includes(query)
            );
            displaySearchSuggestions(suggestions, query);
        } else {
            document.getElementById('searchSuggestions').innerHTML = '';
        }
    });

    // Close search when pressing Escape or clicking outside
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSearch();
        }
    });

    // Close search when clicking outside the search container
    document.getElementById('searchModal').addEventListener('click', (e) => {
        if (e.target.id === 'searchModal') {
            closeSearch();
        }
    });

    // Filter dropdown toggle
    const filterBtn = document.getElementById('filterBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    filterBtn.addEventListener('click', () => {
        dropdownMenu.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown')) {
            dropdownMenu.classList.remove('active');
        }
    });

    fetchProjects();
    document.getElementById('cartIcon').addEventListener('click', openCart);
    loadCartFromStorage();
    loadFavoritesFromStorage();
    updateCartCount();
});

// Fetch projects
async function fetchProjects() {
    try {
        const response = await fetch('/api/projects');
        allProjects = await response.json();
        displayProjects(allProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
    }
}

// Search functions
function openSearch() {
    document.getElementById('searchModal').style.display = 'flex';
    document.getElementById('searchInput').focus();
    document.body.style.overflow = 'hidden';
}

function closeSearch() {
    document.getElementById('searchModal').style.display = 'none';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchSuggestions').innerHTML = '';
    document.body.style.overflow = 'auto';
}

function displaySearchSuggestions(suggestions, query) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    if (suggestions.length === 0) {
        suggestionsDiv.innerHTML = '<div class="suggestion-item no-results">No projects found</div>';
        return;
    }
    
    suggestionsDiv.innerHTML = suggestions.map(project => `
        <div class="suggestion-item" onclick="selectSearchResult(${project.id})">
            <div class="suggestion-title">${project.topic}</div>
            <div class="suggestion-meta">${project.subject} • ${project.college}</div>
            <div class="suggestion-price">₹${project.price}</div>
        </div>
    `).join('');
}

function selectSearchResult(projectId) {
    const project = allProjects.find(p => p.id === projectId);
    if (project) {
        closeSearch();
        viewProductDetail(project);
    }
}

// Filter by subject
function filterBySubject(subject) {
    const dropdownMenu = document.getElementById('dropdownMenu');
    dropdownMenu.classList.remove('active');
    
    if (subject === 'All') {
        displayProjects(allProjects);
    } else {
        const filtered = allProjects.filter(p => p.subject === subject);
        displayProjects(filtered);
    }
}

// Display projects
function displayProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '';
    
    if (projects.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><p style="font-size: 1.1rem; color: #6b7280;">No projects available.</p></div>';
        return;
    }
    
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="card-image">
                <img src="https://via.placeholder.com/300x200?text=${encodeURIComponent(project.topic)}" alt="${project.topic}">
            </div>
            <div class="card-info">
                <h3 class="card-title">${project.topic}</h3>
                <p class="card-price">₹${project.price}</p>
            </div>
        `;
        card.addEventListener('click', () => viewProductDetail(project));
        grid.appendChild(card);
    });
}

// View product detail
let currentProductDetail = null;

function viewProductDetail(project) {
    currentProductDetail = project;
    document.getElementById('projects').style.display = 'none';
    document.getElementById('productDetail').style.display = 'flex';
    document.getElementById('detailImage').src = `https://via.placeholder.com/500x600?text=${encodeURIComponent(project.topic)}`;
    document.getElementById('detailName').textContent = project.topic;
    document.getElementById('detailSubject').textContent = project.subject;
    document.getElementById('detailCollege').textContent = project.college;
    document.getElementById('detailPrice').textContent = `₹${project.price}`;
    updateFavoriteButton();
    window.scrollTo(0, 0);
}

// Favorites functionality
function toggleFavorite() {
    if (!currentProductDetail) return;
    
    const productId = currentProductDetail.id;
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
        // Remove from favorites
        favorites.splice(index, 1);
    } else {
        // Add to favorites
        favorites.push(productId);
    }
    
    saveFavoritesToStorage();
    updateFavoriteButton();
}

function updateFavoriteButton() {
    if (!currentProductDetail) return;
    
    const btn = document.getElementById('favoriteBtn');
    if (favorites.includes(currentProductDetail.id)) {
        btn.textContent = '❤️';
    } else {
        btn.textContent = '🤍';
    }
}

function saveFavoritesToStorage() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function loadFavoritesFromStorage() {
    const saved = localStorage.getItem('favorites');
    favorites = saved ? JSON.parse(saved) : [];
}

function backToProjects() {
    document.getElementById('productDetail').style.display = 'none';
    document.getElementById('cartPage').style.display = 'none';
    document.getElementById('projects').style.display = 'block';
    currentProductDetail = null;
    const footer = document.getElementById('mainFooter');
    if (footer) footer.style.display = 'block';
}

function addToCartFromDetail() {
    if (currentProductDetail) {
        addToCart(currentProductDetail.id, currentProductDetail.topic, currentProductDetail.price, currentProductDetail.college);
        openCartModal();
    }
}

// Add to cart
function addToCart(id, topic, price, college) {
    const project = allProjects.find(p => p.id === id);
    if (project) {
        cart.push({
            id,
            topic,
            price,
            college,
            subject: project.subject
        });
        saveCartToStorage();
        updateCartCount();
        alert(`✓ ${topic} added to cart!`);
    }
}

// Update cart count
function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.length;
}

// Open cart (Full page)
function openCart() {
    document.getElementById('productDetail').style.display = 'none';
    document.getElementById('projects').style.display = 'none';
    document.getElementById('cartPage').style.display = 'flex';
    displayFullCart();
    window.scrollTo(0, 0);
}

// Open cart modal (Small popup)
function openCartModal() {
    const modal = document.getElementById('cartModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    displayCart();
}

// Close cart
function closeCart() {
    const modal = document.getElementById('cartModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Display cart items in modal
function displayCart() {
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        document.getElementById('cartTotal').textContent = '0';
        return;
    }
    
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.topic}</div>
                <div class="cart-item-college">${item.college} • ${item.subject}</div>
                <div class="cart-item-price">₹${item.price}</div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">✕</button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cartTotal').textContent = total;
}

// Display cart items in full page
function displayFullCart() {
    const cartPageItems = document.getElementById('cartPageItems');
    
    if (cart.length === 0) {
        cartPageItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        document.getElementById('cartPageTotal').textContent = '0';
        document.getElementById('cartItemCount').textContent = '0';
        document.getElementById('cartBagTotal').textContent = '0';
        document.getElementById('cartAmountPayable').textContent = '0';
        return;
    }
    
    cartPageItems.innerHTML = cart.map((item, index) => `
        <div class="cart-page-item">
            <div class="cart-page-item-image"></div>
            <div class="cart-page-item-info">
                <div class="cart-page-item-name">${item.topic}</div>
                <div class="cart-page-item-college">${item.college} • ${item.subject}</div>
                <div class="cart-page-item-options">
                    <span>Subject ▼</span>
                    <span>Qty 1 ▼</span>
                </div>
                <div class="cart-page-item-returns">3 day Return and Exchange</div>
            </div>
            <div class="cart-page-item-right">
                <div class="cart-page-item-price">₹${item.price}</div>
                <div class="cart-page-item-delivery">Delivery by 05th Jan</div>
                <button class="cart-page-item-remove" onclick="removeFromCart(${index})">Remove</button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const itemCount = cart.length;
    const itemS = itemCount === 1 ? '' : 's';
    
    document.getElementById('cartItemCount').textContent = itemCount;
    document.getElementById('cartProductS').textContent = itemS;
    document.getElementById('cartPageTotal').textContent = total;
    document.getElementById('cartBagTotal').textContent = total;
    document.getElementById('cartAmountPayable').textContent = total;
}

// View full cart page
function viewFullCart() {
    document.getElementById('productDetail').style.display = 'none';
    document.getElementById('projects').style.display = 'none';
    document.getElementById('cartPage').style.display = 'flex';
    displayFullCart();
    window.scrollTo(0, 0);
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartCount();
    displayCart();
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const projects = cart.map(item => item.topic).join('\n  - ');
    
    alert(`✓ Order Confirmed!\n\nProjects:\n  - ${projects}\n\nTotal: ₹${total}\n\nProject files will be sent to your email shortly!`);
    
    cart = [];
    saveCartToStorage();
    updateCartCount();
    closeCart();
}

// Local storage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch (e) {
            cart = [];
        }
    }
}

// Close modal on outside click
window.addEventListener('click', (event) => {
    const modal = document.getElementById('cartModal');
    if (event.target === modal) {
        closeCart();
    }
});

// Prevent body scroll when modal is open
const style = document.createElement('style');
style.textContent = `
    body.modal-open {
        overflow: hidden;
    }
`;
document.head.appendChild(style);

// Admin Functions
let isAdminLoggedIn = false;

function showAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'flex';
    document.getElementById('adminUsername').focus();
}

function closeAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
}

function adminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // Hardcoded credentials for demo
    if (username === 'Admin' && password === 'Admin123') {
        isAdminLoggedIn = true;
        closeAdminLogin();
        showAdminDashboard();
    } else {
        alert('Invalid username or password!');
        document.getElementById('adminPassword').value = '';
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('projects').style.display = 'block';
    const footer = document.getElementById('mainFooter');
    if (footer) footer.style.display = 'block';
    window.scrollTo(0, 0);
}

function showAdminDashboard() {
    document.getElementById('projects').style.display = 'none';
    document.getElementById('productDetail').style.display = 'none';
    document.getElementById('cartPage').style.display = 'none';
    document.getElementById('adminSection').style.display = 'flex';
    updateAdminDashboard();
    window.scrollTo(0, 0);
}

function updateAdminDashboard() {
    // Calculate meaningful stats
    const totalRevenue = allProjects.reduce((sum, p) => sum + p.price, 0);
    const subjects = [...new Set(allProjects.map(p => p.subject))];
    const colleges = [...new Set(allProjects.map(p => p.college))];
    
    // Update quick stats safely
    const notificationCountEl = document.getElementById('notificationCount');
    const orderConfirmCountEl = document.getElementById('orderConfirmCount');
    const confirmedOrderCountEl = document.getElementById('confirmedOrderCount');
    const cancelledOrderCountEl = document.getElementById('cancelledOrderCount');
    
    if (notificationCountEl) notificationCountEl.textContent = '12';
    if (orderConfirmCountEl) orderConfirmCountEl.textContent = '8';
    if (confirmedOrderCountEl) confirmedOrderCountEl.textContent = '45';
    if (cancelledOrderCountEl) cancelledOrderCountEl.textContent = '3';
    
    // Update stats - Box 1: Users & Revenue
    const registeredUsersEl = document.getElementById('registeredUsers');
    const visitorsEl = document.getElementById('visitors');
    const todaySalesEl = document.getElementById('todaySales');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    if (registeredUsersEl) registeredUsersEl.textContent = '1,234';
    if (visitorsEl) visitorsEl.textContent = '5,678';
    if (todaySalesEl) todaySalesEl.textContent = '42';
    if (totalRevenueEl) totalRevenueEl.textContent = '₹' + totalRevenue.toLocaleString();
    
    // Update stats - Box 2: Projects & Classification
    const totalProjectsEl = document.getElementById('totalProjects');
    const projectTypesEl = document.getElementById('projectTypes');
    const totalSubjectsEl = document.getElementById('totalSubjects');
    const totalCollegesEl = document.getElementById('totalColleges');
    
    if (totalProjectsEl) totalProjectsEl.textContent = allProjects.length;
    if (projectTypesEl) projectTypesEl.textContent = allProjects.length;
    if (totalSubjectsEl) totalSubjectsEl.textContent = subjects.length;
    if (totalCollegesEl) totalCollegesEl.textContent = colleges.length;
    
    // Populate filter dropdown
    const filterSelect = document.getElementById('adminFilterSubject');
    filterSelect.innerHTML = '<option value="">All Subjects</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        filterSelect.appendChild(option);
    });
    
    // Populate filter dropdown in main dropdown too
    const mainDropdown = document.getElementById('dropdownMenu');
    mainDropdown.innerHTML = '<button class="dropdown-item" onclick="filterBySubject(\'All\')">All Subjects</button>';
    subjects.forEach(subject => {
        const btn = document.createElement('button');
        btn.className = 'dropdown-item';
        btn.onclick = () => filterBySubject(subject);
        btn.textContent = subject;
        mainDropdown.appendChild(btn);
    });
    
    
    // Display all projects
    displayAdminProjects(allProjects);
    
    // Create bar graphs
    createProjectCharts(subjects, colleges);
    
    // Display users on dashboard
    displayAdminUsers();
}

function createProjectCharts(subjects, colleges) {
    // Registered Users by Subject (sample data based on projects)
    const userCounts = {};
    subjects.forEach(s => {
        const projectCount = allProjects.filter(p => p.subject === s).length;
        userCounts[s] = Math.floor(projectCount * 12 + Math.random() * 50);
    });
    
    const subjectCtx = document.getElementById('subjectChart');
    if (subjectCtx && window.subjectChartInstance) {
        window.subjectChartInstance.destroy();
    }
    
    if (subjectCtx) {
        window.subjectChartInstance = new Chart(subjectCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(userCounts),
                datasets: [{
                    label: 'Users',
                    data: Object.values(userCounts),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 50 } }
                }
            }
        });
    }
    
    // Total Revenue by College
    const revenueByCollege = {};
    colleges.forEach(c => {
        const collegeProjects = allProjects.filter(p => p.college === c);
        const revenue = collegeProjects.reduce((sum, p) => sum + p.price, 0);
        revenueByCollege[c] = revenue;
    });
    
    const collegeCtx = document.getElementById('collegeChart');
    if (collegeCtx && window.collegeChartInstance) {
        window.collegeChartInstance.destroy();
    }
    
    if (collegeCtx) {
        window.collegeChartInstance = new Chart(collegeCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(revenueByCollege),
                datasets: [{
                    label: 'Revenue (₹)',
                    data: Object.values(revenueByCollege),
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        ticks: { 
                            stepSize: 1000,
                            callback: function(value) {
                                return '₹' + value;
                            }
                        }
                    }
                }
            }
        });
    }
}

function displayAdminProjects(projects) {
    const projectsList = document.getElementById('adminProjectsList');
    
    if (projects.length === 0) {
        projectsList.innerHTML = '<div class="admin-empty-state"><p>No projects found</p></div>';
        return;
    }
    
    projectsList.innerHTML = projects.map((project, index) => `
        <div class="admin-project-card">
            <div class="admin-project-number">#${project.id}</div>
            <div class="admin-project-info">
                <h4>${project.topic}</h4>
                <div class="admin-project-meta">
                    <span class="meta-badge subject-badge">${project.subject}</span>
                    <span class="meta-badge college-badge">${project.college}</span>
                </div>
                <div class="admin-project-details">
                    <span class="detail-item">💰 ₹${project.price}</span>
                    <span class="detail-item">📥 ${project.downloads || 0} downloads</span>
                    <span class="detail-item">📅 ${project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
            <div class="admin-project-actions">
                <button class="admin-btn-delete" onclick="deleteProject(${project.id})" title="Delete Project">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function switchAdminTab(tabName) {
    // Hide all tabs
    document.getElementById('projectsTab').classList.remove('active');
    document.getElementById('addprojectTab').classList.remove('active');
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

function openUserManagementPage() {
    // Hide admin section
    document.getElementById('adminSection').style.display = 'none';
    
    // Show user management page
    document.getElementById('userManagementPage').style.display = 'block';
    
    // Load and display users
    displayAdminUsersFull();
    
    window.scrollTo(0, 0);
}

function closeUserManagementPage() {
    // Hide user management page
    document.getElementById('userManagementPage').style.display = 'none';
    
    // Show admin section
    document.getElementById('adminSection').style.display = 'flex';
    
    window.scrollTo(0, 0);
}

function displayAdminUsersFull(users = sampleUsers) {
    const usersList = document.getElementById('adminUsersListFull');
    const totalDisplay = document.getElementById('totalUsersDisplay');
    const bannedDisplay = document.getElementById('bannedUsersDisplay');
    
    if (totalDisplay) totalDisplay.textContent = sampleUsers.length;
    const bannedCount = sampleUsers.filter(u => u.banned).length;
    if (bannedDisplay) bannedDisplay.textContent = bannedCount;
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="admin-empty-state"><p>No users found</p></div>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="admin-user-card-grid">
            <div class="user-card-header">
                <div class="user-avatar-small">👤</div>
                <div class="user-card-title">
                    <h4>${user.name}</h4>
                    <p class="user-email-small">${user.email}</p>
                </div>
            </div>
            <div class="user-card-body">
                <p class="user-college-small">🏫 ${user.college}</p>
                <div class="user-card-date">
                    <span class="date-icon">📅</span>
                    <span class="date-text">Joined ${new Date(user.joinDate).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleBanFilter() {
    isBanFilterActive = !isBanFilterActive;
    
    const banBox = document.getElementById('banAccountBox');
    if (isBanFilterActive) {
        banBox.style.opacity = '0.7';
        banBox.style.transform = 'scale(0.95)';
        const bannedUsers = sampleUsers.filter(u => u.banned);
        displayAdminUsersFull(bannedUsers);
    } else {
        banBox.style.opacity = '1';
        banBox.style.transform = 'scale(1)';
        displayAdminUsersFull(sampleUsers);
    }
}

function adminSearchUsersFull() {
    const query = document.getElementById('userSearchInputFull').value.toLowerCase();
    let filtered = sampleUsers.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.college.toLowerCase().includes(query)
    );
    
    // Apply ban filter if active
    if (isBanFilterActive) {
        filtered = filtered.filter(u => u.banned);
    }
    
    displayAdminUsersFull(filtered);
}

function adminSearchProjects() {
    const query = document.getElementById('adminSearchInput').value.toLowerCase();
    const filtered = allProjects.filter(p =>
        p.topic.toLowerCase().includes(query) ||
        p.subject.toLowerCase().includes(query) ||
        p.college.toLowerCase().includes(query)
    );
    displayAdminProjects(filtered);
}

function adminFilterProjects() {
    const subject = document.getElementById('adminFilterSubject').value;
    const filtered = subject === '' ? allProjects : allProjects.filter(p => p.subject === subject);
    displayAdminProjects(filtered);
}

// Sample users data
const sampleUsers = [
    { id: 1, name: 'Aryan Mishra', email: 'aryan@example.com', college: 'IIT Delhi', purchases: 5, joinDate: '2025-01-15', banned: false },
    { id: 2, name: 'Priya Singh', email: 'priya@example.com', college: 'NIT Bangalore', purchases: 3, joinDate: '2025-01-20', banned: true },
    { id: 3, name: 'Amit Patel', email: 'amit@example.com', college: 'Delhi University', purchases: 8, joinDate: '2025-01-10', banned: false },
    { id: 4, name: 'Neha Gupta', email: 'neha@example.com', college: 'IIT Bombay', purchases: 2, joinDate: '2025-01-25', banned: true },
    { id: 5, name: 'Arjun Verma', email: 'arjun@example.com', college: 'NIT Pune', purchases: 6, joinDate: '2025-01-18', banned: false },
    { id: 6, name: 'Sneha Reddy', email: 'sneha@example.com', college: 'IIT Madras', purchases: 7, joinDate: '2025-01-12', banned: false },
    { id: 7, name: 'Vikram Singh', email: 'vikram@example.com', college: 'BITS Pilani', purchases: 4, joinDate: '2025-01-22', banned: true },
    { id: 8, name: 'Pooja Sharma', email: 'pooja@example.com', college: 'Anna University', purchases: 9, joinDate: '2025-01-08', banned: false },
];

function displayAdminUsers(users = sampleUsers) {
    const usersList = document.getElementById('adminUsersList');
    const totalCount = document.getElementById('totalUsersCount');
    
    totalCount.textContent = users.length;
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="admin-empty-state"><p>No users found</p></div>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="admin-user-card-grid">
            <div class="user-card-header">
                <div class="user-avatar-small">👤</div>
                <div class="user-card-title">
                    <h4>${user.name}</h4>
                    <p class="user-email-small">${user.email}</p>
                </div>
            </div>
            <div class="user-card-body">
                <p class="user-college-small">🏫 ${user.college}</p>
                <div class="user-card-stats">
                    <div class="stat-item">
                        <span class="stat-icon">🛒</span>
                        <span class="stat-text">${user.purchases}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">📅</span>
                        <span class="stat-text">${new Date(user.joinDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function adminSearchUsers() {
    const query = document.getElementById('userSearchInput').value.toLowerCase();
    const filtered = sampleUsers.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.college.toLowerCase().includes(query)
    );
    displayAdminUsers(filtered);
}

// Empty function for backward compatibility (analytics tab removed)
function updateAnalytics() {
    // Analytics tab removed - replaced with User Management
}

function addNewProject(event) {
    event.preventDefault();
    
    const topic = document.getElementById('newProjectTopic').value;
    const subject = document.getElementById('newProjectSubject').value;
    const college = document.getElementById('newProjectCollege').value;
    const price = parseInt(document.getElementById('newProjectPrice').value);
    
    const newProject = {
        subject,
        college,
        topic,
        price,
        file: topic.toLowerCase().replace(/\s+/g, '-') + '.zip'
    };
    
    // Send to server
    fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
    })
    .then(res => res.json())
    .then(project => {
        allProjects.push(project);
        event.target.reset();
        alert(`✓ Project "${topic}" added successfully!`);
        updateAdminDashboard();
        switchAdminTab('projects');
        fetchProjects();
    })
    .catch(error => {
        console.error('Error adding project:', error);
        alert('Failed to add project. Ensure database is connected.');
    });
}

function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
        fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
            allProjects = allProjects.filter(p => p.id !== projectId);
            updateAdminDashboard();
            fetchProjects();
        })
        .catch(error => {
            console.error('Error deleting project:', error);
            alert('Failed to delete project.');
        });
    }
}

// Open stat section when card is clicked
function openStatSection(sectionType) {
    if (sectionType === 'notifications') {
        openNotificationsChat();
    } else if (sectionType === 'orderConfirm') {
        openOrderConfirmChat();
    } else if (sectionType === 'confirmedOrders') {
        openConfirmedOrdersChat();
    } else if (sectionType === 'cancelledOrders') {
        openCancelledOrdersChat();
    }
}

// Notifications Chat Functions
function openNotificationsChat() {
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('notificationsChatPage').style.display = 'block';
    document.body.style.overflow = 'hidden';
    const footer = document.getElementById('mainFooter');
    if (footer) footer.style.display = 'none';
    loadChatUsers();
}

function closeNotificationsChat() {
    document.getElementById('notificationsChatPage').style.display = 'none';
    document.getElementById('adminSection').style.display = 'flex';
    document.body.style.overflow = 'auto';
}

// Order Confirmation Chat Functions
function openOrderConfirmChat() {
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('orderConfirmChatPage').style.display = 'block';
    document.body.style.overflow = 'hidden';
    loadPendingOrders();
}

function closeOrderConfirmChat() {
    document.getElementById('orderConfirmChatPage').style.display = 'none';
    document.getElementById('adminSection').style.display = 'flex';
    document.body.style.overflow = 'auto';
}

// Confirmed Orders Chat Functions
function openConfirmedOrdersChat() {
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('confirmedOrdersChatPage').style.display = 'block';
    document.body.style.overflow = 'hidden';
    loadConfirmedOrders();
}

function closeConfirmedOrdersChat() {
    document.getElementById('confirmedOrdersChatPage').style.display = 'none';
    document.getElementById('adminSection').style.display = 'flex';
    document.body.style.overflow = 'auto';
}

// Cancelled Orders Chat Functions
function openCancelledOrdersChat() {
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('cancelledOrdersChatPage').style.display = 'block';
    document.body.style.overflow = 'hidden';
    loadCancelledOrders();
}

function closeCancelledOrdersChat() {
    document.getElementById('cancelledOrdersChatPage').style.display = 'none';
    document.getElementById('adminSection').style.display = 'flex';
    document.body.style.overflow = 'auto';
}

// Load chat users from database
function loadChatUsers() {
    const chatUsersList = document.getElementById('chatUsersList');
    if (!chatUsersList) return;
    
    chatUsersList.innerHTML = '<div class="chat-empty-state">Loading users...</div>';
    
    // Show sample users if no real users
    const users = sampleUsers;
    
    if (users.length === 0) {
        chatUsersList.innerHTML = '<div class="chat-empty-state">No registered users yet</div>';
        const totalEl = document.getElementById('totalUsersInChat');
        if (totalEl) totalEl.textContent = '0';
        return;
    }
    
    let html = '';
    users.forEach((user, index) => {
        const isActive = index === 0 ? 'active' : '';
        html += `
            <div class="chat-user-item ${isActive}" onclick="selectChatUser(this, 'user${user.id}', '${user.name.replace(/'/g, "\\'")}', '${user.email}', '${user.college}')">
                <div class="chat-user-item-avatar">👤</div>
                <div class="chat-user-item-content">
                    <div class="chat-user-item-name">${user.name}</div>
                </div>
            </div>
        `;
    });
    chatUsersList.innerHTML = html;
    const totalEl = document.getElementById('totalUsersInChat');
    if (totalEl) totalEl.textContent = users.length;
}

function selectChatUser(element, userId, userName, userEmail, userCollege) {
    // Remove active class from all user items
    document.querySelectorAll('.chat-user-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected item
    element.classList.add('active');
    
    // Open the user chat section directly
    openUserChat(userId, userName);
}

let attachedFiles = [];
let fileStorage = {}; // Store file references with unique IDs

// Store current active user chat
let currentChatUserId = null;
let currentChatUserName = null;
let userMessages = {}; // Store messages per user ID

function openUserChat(userId, userName) {
    const notifsChatPage = document.getElementById('notificationsChatPage');
    const userChatPage = document.getElementById('userChatPage');
    const userChatName = document.getElementById('userChatName');
    const userChatMessages = document.getElementById('userChatMessages');
    const userMessageInput = document.getElementById('userMessageInput');
    
    if (!notifsChatPage || !userChatPage || !userChatName || !userChatMessages || !userMessageInput) {
        console.error('Chat elements not found');
        return;
    }
    
    // Set current active user
    currentChatUserId = userId;
    currentChatUserName = userName;
    
    notifsChatPage.style.display = 'none';
    userChatPage.style.display = 'block';
    userChatName.textContent = userName;
    document.body.style.overflow = 'hidden';
    const footer = document.getElementById('mainFooter');
    if (footer) footer.style.display = 'none';
    
    // Initialize messages array for this user if not exists
    if (!userMessages[userId]) {
        userMessages[userId] = [
            { type: 'other', text: 'Hey, how are you?', time: '10:30 AM' },
            { type: 'admin', text: 'Hi! I\'m good, thanks for asking', time: '10:32 AM' },
            { type: 'other', text: 'Do you need any help with projects?', time: '10:35 AM' },
            { type: 'admin', text: 'Yes, I need CSE project help', time: '10:37 AM' }
        ];
    }
    
    // Load messages for this specific user
    loadUserMessages(userId);
    
    // Scroll to bottom
    setTimeout(() => {
        userChatMessages.scrollTop = userChatMessages.scrollHeight;
    }, 100);
    
    userMessageInput.focus();
    attachedFiles = [];
    updateAttachedFilesPreview();
}

function loadUserMessages(userId) {
    const userChatMessages = document.getElementById('userChatMessages');
    if (!userChatMessages) return;
    
    const messages = userMessages[userId] || [];
    const messagesHTML = messages.map(msg => `
        <div class="chat-message-item ${msg.type}">
            <div class="chat-message-bubble">${msg.text}</div>
            <div class="chat-message-time">${msg.time}</div>
        </div>
    `).join('');
    
    userChatMessages.innerHTML = messagesHTML;
}

function closeUserChat() {
    const userChatPage = document.getElementById('userChatPage');
    const notifsChatPage = document.getElementById('notificationsChatPage');
    
    if (userChatPage) userChatPage.style.display = 'none';
    if (notifsChatPage) notifsChatPage.style.display = 'block';
    document.body.style.overflow = 'auto';
    const footer = document.getElementById('mainFooter');
    if (footer) footer.style.display = 'block';
    attachedFiles = [];
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    attachedFiles = [...attachedFiles, ...files];
    updateAttachedFilesPreview();
    event.target.value = '';
}

function updateAttachedFilesPreview() {
    const preview = document.getElementById('attachedFilesPreview');
    if (!preview) return;
    
    if (attachedFiles.length === 0) {
        preview.innerHTML = '';
        preview.style.display = 'none';
        return;
    }
    
    preview.style.display = 'flex';
    preview.innerHTML = attachedFiles.map((file, index) => `
        <div class="file-preview-item">
            📄 ${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
            <button class="file-preview-remove" onclick="removeAttachedFile(${index})" title="Remove">✕</button>
        </div>
    `).join('');
}

function removeAttachedFile(index) {
    attachedFiles.splice(index, 1);
    updateAttachedFilesPreview();
}

function sendMessage() {
    const input = document.getElementById('userMessageInput');
    const messagesDiv = document.getElementById('userChatMessages');
    
    if (!input || !messagesDiv) {
        console.error('Message elements not found');
        return;
    }
    
    // Check if user is selected
    if (!currentChatUserId) {
        alert('Please select a user to send message');
        return;
    }
    
    const message = input.value.trim();
    
    if (message || attachedFiles.length > 0) {
        const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        let messageContent = '';
        
        if (attachedFiles.length > 0) {
            const filesHTML = attachedFiles.map(file => {
                const fileId = 'file_' + Math.random().toString(36).substr(2, 9);
                fileStorage[fileId] = file;
                return `<span class="file-link" onclick="openFile('${fileId}')" title="Click to open/download">📎 ${file.name}</span>`;
            }).join('<br>');
            messageContent += `<div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.3rem;">${filesHTML}</div>`;
        }
        
        if (message) {
            messageContent += message;
        }
        
        // Store message in user-specific array
        if (!userMessages[currentChatUserId]) {
            userMessages[currentChatUserId] = [];
        }
        
        userMessages[currentChatUserId].push({
            type: 'admin',
            text: messageContent,
            time: currentTime
        });
        
        const messageHTML = `
            <div class="chat-message-item admin">
                <div class="chat-message-bubble">${messageContent}</div>
                <div class="chat-message-time">${currentTime}</div>
            </div>
        `;
        messagesDiv.innerHTML += messageHTML;
        input.value = '';
        attachedFiles = [];
        updateAttachedFilesPreview();
        
        // Scroll to bottom with smooth animation
        setTimeout(() => {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }, 10);
        
        console.log(`Message sent to user ${currentChatUserId} (${currentChatUserName}): ${message}`);
    }
}

function openFile(fileId) {
    const file = fileStorage[fileId];
    if (!file) {
        alert('File not found');
        return;
    }
    
    // Create blob URL and trigger download/open
    const blobUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = file.name;
    
    // For images and PDFs, try to open in new window first
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const pdfType = 'application/pdf';
    
    if (imageTypes.includes(file.type) || file.type === pdfType) {
        // Open in new window
        window.open(blobUrl, '_blank');
        // Also set up download as fallback
        setTimeout(() => {
            link.click();
            URL.revokeObjectURL(blobUrl);
        }, 1000);
    } else {
        // For other files, just download
        link.click();
        URL.revokeObjectURL(blobUrl);
    }
}

// Store orders data
let pendingOrdersData = [];
let confirmedOrdersData = [];
let cancelledOrdersData = [];
let notificationsData = [];
let selectedOrderId = null;

// Load Pending Orders from API
async function loadPendingOrders() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '<div class="skeleton-loader"><div class="skeleton-item"></div><div class="skeleton-item"></div><div class="skeleton-item"></div></div>';
    
    try {
        const response = await fetch('/api/orders?status=pending');
        pendingOrdersData = await response.json();
        
        const totalEl = document.getElementById('totalOrdersPending');
        const valueEl = document.getElementById('pendingOrdersValue');
        
        if (totalEl) totalEl.textContent = pendingOrdersData.length;
        
        const totalValue = pendingOrdersData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        if (valueEl) valueEl.textContent = '₹' + totalValue.toLocaleString();
        
        if (pendingOrdersData.length === 0) {
            ordersList.innerHTML = `
                <div class="chat-empty-state animated">
                    <div class="empty-icon">📭</div>
                    <h3>No pending orders</h3>
                    <p>All orders have been processed</p>
                </div>
            `;
            return;
        }
        
        ordersList.innerHTML = pendingOrdersData.map((order, index) => `
            <div class="order-card ${index === 0 ? 'active' : ''}" onclick="selectPendingOrder(${order.id})" style="animation-delay: ${index * 0.1}s">
                <div class="order-card-header">
                    <span class="order-id">📦 Order #${order.id}</span>
                    <span class="order-amount">₹${order.total_amount || 0}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-customer">👤 ${order.customer_name || 'Guest'}</div>
                    <div class="order-date">📅 ${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <span class="status-badge pending">⏳ Pending</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading pending orders:', error);
        ordersList.innerHTML = '<div class="chat-empty-state"><p>Failed to load orders</p></div>';
    }
}

// Select and show pending order details
async function selectPendingOrder(orderId) {
    selectedOrderId = orderId;
    
    // Update active state
    document.querySelectorAll('#ordersList .order-card').forEach(card => card.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const detailPanel = document.getElementById('orderDetailInfo');
    detailPanel.innerHTML = '<div class="skeleton-loader"><div class="skeleton-item"></div><div class="skeleton-item"></div></div>';
    
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        const order = await response.json();
        
        detailPanel.innerHTML = `
            <div class="order-detail-view">
                <div class="order-detail-header">
                    <h3 class="order-detail-title">Order #${order.id}</h3>
                    <span class="status-badge pending">⏳ Pending</span>
                </div>
                
                <div class="order-detail-section">
                    <h4>Customer Information</h4>
                    <div class="customer-info-card">
                        <div class="customer-info-row"><span>👤</span> ${order.customer_name || 'Guest'}</div>
                        <div class="customer-info-row"><span>📧</span> ${order.customer_email || 'No email'}</div>
                        <div class="customer-info-row"><span>📱</span> ${order.customer_phone || 'No phone'}</div>
                        <div class="customer-info-row"><span>📍</span> ${order.customer_address || 'No address'}</div>
                    </div>
                </div>
                
                <div class="order-detail-section">
                    <h4>Order Items</h4>
                    <div class="order-items-list">
                        ${order.items && order.items.length > 0 ? order.items.map(item => `
                            <div class="order-item-row">
                                <div class="order-item-info">
                                    <h5>${item.topic || 'Project'}</h5>
                                    <p>${item.subject || ''} ${item.college ? '• ' + item.college : ''}</p>
                                </div>
                                <span class="order-item-price">₹${item.price || 0}</span>
                            </div>
                        `).join('') : '<p>No items in order</p>'}
                    </div>
                </div>
                
                <div class="order-total-summary">
                    <div class="total-row"><span>Subtotal</span><span>₹${order.total_amount || 0}</span></div>
                    <div class="total-row"><span>Delivery</span><span>Free</span></div>
                    <div class="total-row final"><span>Total</span><span class="total-amount">₹${order.total_amount || 0}</span></div>
                </div>
                
                <div class="order-actions">
                    <button class="action-btn confirm" onclick="confirmOrder(${order.id})">✅ Confirm Order</button>
                    <button class="action-btn cancel" onclick="cancelOrder(${order.id})">❌ Cancel Order</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading order details:', error);
        detailPanel.innerHTML = '<p>Failed to load order details</p>';
    }
}

// Confirm order
async function confirmOrder(orderId) {
    if (!confirm('Confirm this order?')) return;
    
    try {
        await fetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'confirmed' })
        });
        
        alert('Order confirmed successfully!');
        loadPendingOrders();
        updateOrderStats();
        
        // Reset detail panel
        document.getElementById('orderDetailInfo').innerHTML = `
            <div class="chat-empty-state animated">
                <div class="empty-icon">📋</div>
                <h3>Select an order to confirm</h3>
                <p>Click on any pending order from the list</p>
            </div>
        `;
    } catch (error) {
        console.error('Error confirming order:', error);
        alert('Failed to confirm order');
    }
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
        await fetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' })
        });
        
        alert('Order cancelled!');
        loadPendingOrders();
        updateOrderStats();
        
        // Reset detail panel
        document.getElementById('orderDetailInfo').innerHTML = `
            <div class="chat-empty-state animated">
                <div class="empty-icon">📋</div>
                <h3>Select an order to confirm</h3>
                <p>Click on any pending order from the list</p>
            </div>
        `;
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel order');
    }
}

// Load Confirmed Orders from API
async function loadConfirmedOrders() {
    const confirmedList = document.getElementById('confirmedOrdersList');
    confirmedList.innerHTML = '<div class="skeleton-loader"><div class="skeleton-item"></div><div class="skeleton-item"></div><div class="skeleton-item"></div></div>';
    
    try {
        const response = await fetch('/api/orders?status=confirmed');
        confirmedOrdersData = await response.json();
        
        const totalEl = document.getElementById('totalConfirmedOrders');
        const revenueEl = document.getElementById('confirmedOrdersRevenue');
        
        if (totalEl) totalEl.textContent = confirmedOrdersData.length;
        
        const totalRevenue = confirmedOrdersData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        if (revenueEl) revenueEl.textContent = '₹' + totalRevenue.toLocaleString();
        
        if (confirmedOrdersData.length === 0) {
            confirmedList.innerHTML = `
                <div class="chat-empty-state animated">
                    <div class="empty-icon success-bg">🎉</div>
                    <h3>No confirmed orders yet</h3>
                    <p>Confirm pending orders to see them here</p>
                </div>
            `;
            return;
        }
        
        confirmedList.innerHTML = confirmedOrdersData.map((order, index) => `
            <div class="order-card ${index === 0 ? 'active' : ''}" onclick="selectConfirmedOrder(${order.id})" style="animation-delay: ${index * 0.1}s">
                <div class="order-card-header">
                    <span class="order-id">✅ Order #${order.id}</span>
                    <span class="order-amount">₹${order.total_amount || 0}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-customer">👤 ${order.customer_name || 'Guest'}</div>
                    <div class="order-date">📅 ${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <span class="status-badge confirmed">✓ Confirmed</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading confirmed orders:', error);
        confirmedList.innerHTML = '<div class="chat-empty-state"><p>Failed to load orders</p></div>';
    }
}

// Select confirmed order
async function selectConfirmedOrder(orderId) {
    document.querySelectorAll('#confirmedOrdersList .order-card').forEach(card => card.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const detailPanel = document.getElementById('confirmedOrderDetailInfo');
    detailPanel.innerHTML = '<div class="skeleton-loader"><div class="skeleton-item"></div><div class="skeleton-item"></div></div>';
    
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        const order = await response.json();
        
        detailPanel.innerHTML = `
            <div class="order-detail-view">
                <div class="order-detail-header">
                    <h3 class="order-detail-title">Order #${order.id}</h3>
                    <span class="status-badge confirmed">✓ Confirmed</span>
                </div>
                
                <div class="order-detail-section">
                    <h4>Customer Information</h4>
                    <div class="customer-info-card">
                        <div class="customer-info-row"><span>👤</span> ${order.customer_name || 'Guest'}</div>
                        <div class="customer-info-row"><span>📧</span> ${order.customer_email || 'No email'}</div>
                        <div class="customer-info-row"><span>📱</span> ${order.customer_phone || 'No phone'}</div>
                        <div class="customer-info-row"><span>📍</span> ${order.customer_address || 'No address'}</div>
                    </div>
                </div>
                
                <div class="order-detail-section">
                    <h4>Order Items</h4>
                    <div class="order-items-list">
                        ${order.items && order.items.length > 0 ? order.items.map(item => `
                            <div class="order-item-row">
                                <div class="order-item-info">
                                    <h5>${item.topic || 'Project'}</h5>
                                    <p>${item.subject || ''} ${item.college ? '• ' + item.college : ''}</p>
                                </div>
                                <span class="order-item-price">₹${item.price || 0}</span>
                            </div>
                        `).join('') : '<p>No items in order</p>'}
                    </div>
                </div>
                
                <div class="order-total-summary">
                    <div class="total-row"><span>Subtotal</span><span>₹${order.total_amount || 0}</span></div>
                    <div class="total-row"><span>Delivery</span><span>Free</span></div>
                    <div class="total-row final"><span>Total</span><span class="total-amount">₹${order.total_amount || 0}</span></div>
                </div>
                
                <div class="order-detail-section">
                    <p style="color: #10b981; font-weight: 600; text-align: center;">🎉 Order completed on ${new Date(order.updated_at).toLocaleDateString('en-IN')}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading order details:', error);
        detailPanel.innerHTML = '<p>Failed to load order details</p>';
    }
}

// Load Cancelled Orders from API
async function loadCancelledOrders() {
    const cancelledList = document.getElementById('cancelledOrdersList');
    cancelledList.innerHTML = '<div class="skeleton-loader"><div class="skeleton-item"></div><div class="skeleton-item"></div><div class="skeleton-item"></div></div>';
    
    try {
        const response = await fetch('/api/orders?status=cancelled');
        cancelledOrdersData = await response.json();
        
        const totalEl = document.getElementById('totalCancelledOrders');
        const lossEl = document.getElementById('cancelledOrdersLoss');
        
        if (totalEl) totalEl.textContent = cancelledOrdersData.length;
        
        const totalLoss = cancelledOrdersData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        if (lossEl) lossEl.textContent = '₹' + totalLoss.toLocaleString();
        
        if (cancelledOrdersData.length === 0) {
            cancelledList.innerHTML = `
                <div class="chat-empty-state animated">
                    <div class="empty-icon danger-bg">📭</div>
                    <h3>No cancelled orders</h3>
                    <p>No orders have been cancelled</p>
                </div>
            `;
            return;
        }
        
        cancelledList.innerHTML = cancelledOrdersData.map((order, index) => `
            <div class="order-card ${index === 0 ? 'active' : ''}" onclick="selectCancelledOrder(${order.id})" style="animation-delay: ${index * 0.1}s">
                <div class="order-card-header">
                    <span class="order-id">❌ Order #${order.id}</span>
                    <span class="order-amount" style="color: #dc2626;">₹${order.total_amount || 0}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-customer">👤 ${order.customer_name || 'Guest'}</div>
                    <div class="order-date">📅 ${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <span class="status-badge cancelled">✗ Cancelled</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading cancelled orders:', error);
        cancelledList.innerHTML = '<div class="chat-empty-state"><p>Failed to load orders</p></div>';
    }
}

// Select cancelled order
async function selectCancelledOrder(orderId) {
    document.querySelectorAll('#cancelledOrdersList .order-card').forEach(card => card.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const detailPanel = document.getElementById('cancelledOrderDetailInfo');
    detailPanel.innerHTML = '<div class="skeleton-loader"><div class="skeleton-item"></div><div class="skeleton-item"></div></div>';
    
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        const order = await response.json();
        
        detailPanel.innerHTML = `
            <div class="order-detail-view">
                <div class="order-detail-header">
                    <h3 class="order-detail-title">Order #${order.id}</h3>
                    <span class="status-badge cancelled">✗ Cancelled</span>
                </div>
                
                <div class="order-detail-section">
                    <h4>Customer Information</h4>
                    <div class="customer-info-card">
                        <div class="customer-info-row"><span>👤</span> ${order.customer_name || 'Guest'}</div>
                        <div class="customer-info-row"><span>📧</span> ${order.customer_email || 'No email'}</div>
                        <div class="customer-info-row"><span>📱</span> ${order.customer_phone || 'No phone'}</div>
                        <div class="customer-info-row"><span>📍</span> ${order.customer_address || 'No address'}</div>
                    </div>
                </div>
                
                <div class="order-detail-section">
                    <h4>Order Items</h4>
                    <div class="order-items-list">
                        ${order.items && order.items.length > 0 ? order.items.map(item => `
                            <div class="order-item-row">
                                <div class="order-item-info">
                                    <h5>${item.topic || 'Project'}</h5>
                                    <p>${item.subject || ''} ${item.college ? '• ' + item.college : ''}</p>
                                </div>
                                <span class="order-item-price" style="color: #dc2626; text-decoration: line-through;">₹${item.price || 0}</span>
                            </div>
                        `).join('') : '<p>No items in order</p>'}
                    </div>
                </div>
                
                <div class="order-total-summary" style="background: #fef2f2;">
                    <div class="total-row"><span>Original Amount</span><span style="text-decoration: line-through;">₹${order.total_amount || 0}</span></div>
                    <div class="total-row final"><span>Lost Revenue</span><span class="total-amount" style="color: #dc2626;">₹${order.total_amount || 0}</span></div>
                </div>
                
                <div class="order-detail-section">
                    <p style="color: #dc2626; font-weight: 600; text-align: center;">❌ Order cancelled on ${new Date(order.updated_at).toLocaleDateString('en-IN')}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading order details:', error);
        detailPanel.innerHTML = '<p>Failed to load order details</p>';
    }
}

// Load Notifications
async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications');
        notificationsData = await response.json();
        
        const unreadCount = notificationsData.filter(n => !n.is_read).length;
        const unreadEl = document.getElementById('unreadNotifications');
        if (unreadEl) unreadEl.textContent = unreadCount;
        
        // Update dashboard counts
        const notifCountEl = document.getElementById('notificationCount');
        if (notifCountEl) notifCountEl.textContent = notificationsData.length;
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Switch notification tab
function switchNotifTab(tab) {
    const tabs = document.querySelectorAll('.sidebar-tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const chatUsersList = document.getElementById('chatUsersList');
    
    if (tab === 'notifications') {
        displayNotificationsList();
    } else {
        loadChatUsers();
    }
}

// Display notifications in list
function displayNotificationsList() {
    const listEl = document.getElementById('chatUsersList');
    
    if (notificationsData.length === 0) {
        listEl.innerHTML = `
            <div class="chat-empty-state animated">
                <div class="empty-icon">🔔</div>
                <h3>No notifications</h3>
                <p>You're all caught up!</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = notificationsData.map((notif, index) => `
        <div class="notification-item ${notif.is_read ? '' : 'unread'}" onclick="markNotificationRead(${notif.id})" style="animation-delay: ${index * 0.05}s">
            <div class="notification-icon">${notif.type === 'order' ? '📦' : '🔔'}</div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${new Date(notif.created_at).toLocaleString('en-IN')}</div>
            </div>
        </div>
    `).join('');
}

// Mark notification as read
async function markNotificationRead(notifId) {
    try {
        await fetch(`/api/notifications/${notifId}/read`, { method: 'PATCH' });
        loadNotifications();
        displayNotificationsList();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Update order stats in admin dashboard
async function updateOrderStats() {
    try {
        const response = await fetch('/api/orders/stats/summary');
        const stats = await response.json();
        
        const pendingEl = document.getElementById('orderConfirmCount');
        const confirmedEl = document.getElementById('confirmedOrderCount');
        const cancelledEl = document.getElementById('cancelledOrderCount');
        
        if (pendingEl) pendingEl.textContent = stats.pending;
        if (confirmedEl) confirmedEl.textContent = stats.confirmed;
        if (cancelledEl) cancelledEl.textContent = stats.cancelled;
        
    } catch (error) {
        console.error('Error updating order stats:', error);
    }
}

// Search functions
function searchChatUsers() {
    const query = document.getElementById('chatUserSearch').value.toLowerCase();
    const filtered = sampleUsers.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    );
    
    const chatUsersList = document.getElementById('chatUsersList');
    if (filtered.length === 0) {
        chatUsersList.innerHTML = '<div class="chat-empty-state"><p>No users found</p></div>';
        return;
    }
    
    chatUsersList.innerHTML = filtered.map((user, index) => `
        <div class="chat-user-item" onclick="selectChatUser(this, 'user${user.id}', '${user.name.replace(/'/g, "\\'")}', '${user.email}', '${user.college}')" style="animation-delay: ${index * 0.05}s">
            <div class="chat-user-item-avatar">👤</div>
            <div class="chat-user-item-content">
                <div class="chat-user-item-name">${user.name}</div>
            </div>
        </div>
    `).join('');
}

function searchPendingOrders() {
    const query = document.getElementById('orderSearchInput').value.toLowerCase();
    const filtered = pendingOrdersData.filter(o =>
        (o.customer_name || '').toLowerCase().includes(query) ||
        o.id.toString().includes(query)
    );
    displayFilteredOrders(filtered, 'ordersList', 'pending');
}

function searchConfirmedOrdersList() {
    const query = document.getElementById('confirmedSearchInput').value.toLowerCase();
    const filtered = confirmedOrdersData.filter(o =>
        (o.customer_name || '').toLowerCase().includes(query) ||
        o.id.toString().includes(query)
    );
    displayFilteredOrders(filtered, 'confirmedOrdersList', 'confirmed');
}

function searchCancelledOrdersList() {
    const query = document.getElementById('cancelledSearchInput').value.toLowerCase();
    const filtered = cancelledOrdersData.filter(o =>
        (o.customer_name || '').toLowerCase().includes(query) ||
        o.id.toString().includes(query)
    );
    displayFilteredOrders(filtered, 'cancelledOrdersList', 'cancelled');
}

function displayFilteredOrders(orders, listId, status) {
    const listEl = document.getElementById(listId);
    
    if (orders.length === 0) {
        listEl.innerHTML = '<div class="chat-empty-state"><p>No orders found</p></div>';
        return;
    }
    
    const icon = status === 'pending' ? '📦' : status === 'confirmed' ? '✅' : '❌';
    const badgeClass = status;
    const badgeText = status === 'pending' ? '⏳ Pending' : status === 'confirmed' ? '✓ Confirmed' : '✗ Cancelled';
    
    listEl.innerHTML = orders.map((order, index) => `
        <div class="order-card" onclick="select${status.charAt(0).toUpperCase() + status.slice(1)}Order(${order.id})" style="animation-delay: ${index * 0.1}s">
            <div class="order-card-header">
                <span class="order-id">${icon} Order #${order.id}</span>
                <span class="order-amount">₹${order.total_amount || 0}</span>
            </div>
            <div class="order-card-body">
                <div class="order-customer">👤 ${order.customer_name || 'Guest'}</div>
                <div class="order-date">📅 ${new Date(order.created_at).toLocaleDateString('en-IN')}</div>
            </div>
            <span class="status-badge ${badgeClass}">${badgeText}</span>
        </div>
    `).join('');
}

// Filter orders by time
function filterPendingOrders(filter) {
    updateFilterChips(event.currentTarget);
    filterOrdersByTime(pendingOrdersData, filter, 'ordersList', 'pending');
}

function filterConfirmedOrders(filter) {
    updateFilterChips(event.currentTarget);
    filterOrdersByTime(confirmedOrdersData, filter, 'confirmedOrdersList', 'confirmed');
}

function filterCancelledOrders(filter) {
    updateFilterChips(event.currentTarget);
    filterOrdersByTime(cancelledOrdersData, filter, 'cancelledOrdersList', 'cancelled');
}

function updateFilterChips(activeChip) {
    const chips = activeChip.parentElement.querySelectorAll('.filter-chip');
    chips.forEach(c => c.classList.remove('active'));
    activeChip.classList.add('active');
}

function filterOrdersByTime(orders, filter, listId, status) {
    const now = new Date();
    let filtered = orders;
    
    if (filter === 'today') {
        filtered = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate.toDateString() === now.toDateString();
        });
    } else if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = orders.filter(o => new Date(o.created_at) >= weekAgo);
    }
    
    displayFilteredOrders(filtered, listId, status);
}

// Close admin login modal on outside click
document.addEventListener('click', (event) => {
    const modal = document.getElementById('adminLoginModal');
    if (event.target === modal) {
        closeAdminLogin();
    }
});
