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
    
    // Update stats - Box 1: Users & Revenue
    document.getElementById('registeredUsers').textContent = '1,234';
    document.getElementById('visitors').textContent = '5,678';
    document.getElementById('todaySales').textContent = '42';
    document.getElementById('totalRevenue').textContent = '₹' + totalRevenue.toLocaleString();
    
    // Update stats - Box 2: Projects & Classification
    document.getElementById('totalProjects').textContent = allProjects.length;
    document.getElementById('projectTypes').textContent = allProjects.length;
    document.getElementById('totalSubjects').textContent = subjects.length;
    document.getElementById('totalColleges').textContent = colleges.length;
    
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
    
    totalDisplay.textContent = sampleUsers.length;
    const bannedCount = sampleUsers.filter(u => u.banned).length;
    bannedDisplay.textContent = bannedCount;
    
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

// Close admin login modal on outside click
document.addEventListener('click', (event) => {
    const modal = document.getElementById('adminLoginModal');
    if (event.target === modal) {
        closeAdminLogin();
    }
});
