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
    // Smooth transition
    const productDetail = document.getElementById('productDetail');
    const cartPage = document.getElementById('cartPage');
    const projects = document.getElementById('projects');
    const footer = document.getElementById('mainFooter');
    
    if (productDetail) {
        productDetail.style.opacity = '0';
        setTimeout(() => {
            productDetail.style.display = 'none';
            productDetail.style.opacity = '1';
        }, 300);
    }
    
    if (cartPage) {
        cartPage.style.opacity = '0';
        setTimeout(() => {
            cartPage.style.display = 'none';
            cartPage.style.opacity = '1';
        }, 300);
    }
    
    setTimeout(() => {
        if (projects) {
            projects.style.display = 'block';
            projects.style.opacity = '0';
            setTimeout(() => {
                projects.style.opacity = '1';
            }, 10);
        }
        if (footer) footer.style.display = 'block';
    }, 300);
    
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

function openManageProjectsPage() {
    // Hide admin section
    document.getElementById('adminSection').style.display = 'none';
    
    // Show manage projects page
    document.getElementById('manageProjectsPage').style.display = 'block';
    
    // Load and display projects
    displayAdminProjects();
    displayProjectStats();
    
    window.scrollTo(0, 0);
}

function displayProjectStats() {
    // Calculate stats
    const projectsBySubject = {};
    let totalProjects = 0;
    
    if (allProjects && allProjects.length > 0) {
        allProjects.forEach(project => {
            const subject = project.subject || 'Unknown';
            projectsBySubject[subject] = (projectsBySubject[subject] || 0) + 1;
            totalProjects++;
        });
    }
    
    // Display total count
    const totalCountEl = document.getElementById('totalProjectsCount');
    if (totalCountEl) {
        totalCountEl.textContent = totalProjects;
    }
    
    // Display projects by subject
    const bySubjectEl = document.getElementById('projectsBySubject');
    if (bySubjectEl) {
        if (totalProjects === 0) {
            bySubjectEl.innerHTML = '<p style="color: #9ca3af; font-size: 0.9rem;">No projects yet</p>';
        } else {
            bySubjectEl.innerHTML = Object.entries(projectsBySubject)
                .map(([subject, count]) => `
                    <p>
                        <span>${subject}</span>
                        <span>${count}</span>
                    </p>
                `)
                .join('');
        }
    }
}

function closeManageProjectsPage() {
    // Hide manage projects page
    document.getElementById('manageProjectsPage').style.display = 'none';
    
    // Show admin section
    document.getElementById('adminSection').style.display = 'flex';
    
    window.scrollTo(0, 0);
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

function addNewCollege(event) {
    event.preventDefault();
    
    const name = document.getElementById('newCollegeName').value;
    const city = document.getElementById('newCollegeCity').value;
    const state = document.getElementById('newCollegeState').value;
    const type = document.getElementById('newCollegeType').value;
    const website = document.getElementById('newCollegeWebsite').value;
    
    const newCollege = {
        name,
        city,
        state,
        type,
        website: website || null
    };
    
    // Store in localStorage for now (can be enhanced with backend API)
    let colleges = JSON.parse(localStorage.getItem('colleges') || '[]');
    newCollege.id = colleges.length + 1;
    colleges.push(newCollege);
    localStorage.setItem('colleges', JSON.stringify(colleges));
    
    event.target.reset();
    alert(`✓ College "${name}" added successfully!`);
}

function addNewProject(event) {
    event.preventDefault();
    
    const topic = document.getElementById('newProjectTopic').value;
    const subject = document.getElementById('newProjectSubject').value;
    const college = document.getElementById('newProjectCollege').value;
    const price = parseInt(document.getElementById('newProjectPrice').value);
    const pages = document.getElementById('newProjectPages').value;
    const description = document.getElementById('newProjectDescription').value;
    
    const newProject = {
        subject,
        college,
        topic,
        price,
        file: topic.toLowerCase().replace(/\s+/g, '-') + '.zip',
        pages: pages || null,
        description: description || null
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
    const adminSection = document.getElementById('adminSection');
    const chatPage = document.getElementById('notificationsChatPage');
    const footer = document.getElementById('mainFooter');
    
    // Smooth transition
    if (adminSection) {
        adminSection.style.opacity = '0';
        setTimeout(() => {
            adminSection.style.display = 'none';
            adminSection.style.opacity = '1';
        }, 250);
    }
    
    setTimeout(() => {
        if (chatPage) {
            chatPage.style.display = 'block';
            chatPage.style.opacity = '0';
            setTimeout(() => {
                chatPage.style.opacity = '1';
            }, 10);
        }
        document.body.style.overflow = 'hidden';
        if (footer) footer.style.display = 'none';
        loadChatUsers();
    }, 250);
}

function closeNotificationsChat() {
    const chatPage = document.getElementById('notificationsChatPage');
    const adminSection = document.getElementById('adminSection');
    
    // Smooth transition
    if (chatPage) {
        chatPage.style.opacity = '0';
        setTimeout(() => {
            chatPage.style.display = 'none';
            chatPage.style.opacity = '1';
        }, 250);
    }
    
    setTimeout(() => {
        if (adminSection) {
            adminSection.style.display = 'flex';
            adminSection.style.opacity = '0';
            setTimeout(() => {
                adminSection.style.opacity = '1';
            }, 10);
        }
        document.body.style.overflow = 'auto';
    }, 250);
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

// WhatsApp-style Chat Variables
let waAttachedFiles = [];
let waFileStorage = {};
let currentWaChatUserId = null;
let currentWaChatUserName = null;
let waUserMessages = {};
let allChatUsers = [];

// Initialize user read status
let userReadStatus = {};

// Track user online status
let userStatus = {};
let currentOnlineUser = null;

// Admin Support Chat Storage
let waAdminMessages = [];
let waAdminAttachedFiles = [];
let typingTimeoutUser = null;
let typingTimeoutAdmin = null;

// Load chat users from database - WhatsApp Style
function loadChatUsers() {
    const chatUsersList = document.getElementById('chatUsersList');
    if (!chatUsersList) return;
    
    chatUsersList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #8696a0;">Loading...</div>';
    
    // Initialize read status for all users
    sampleUsers.forEach(user => {
        if (!userReadStatus[`user${user.id}`]) {
            userReadStatus[`user${user.id}`] = {
                lastReadIndex: -1,
                unreadCount: 0
            };
        }
    });
    
    // Get all users and sort by last message time
    allChatUsers = sampleUsers.map((user, index) => {
        const userId = `user${user.id}`;
        const hasMessages = waUserMessages[userId] && waUserMessages[userId].length > 0;
        const lastMessage = hasMessages ? waUserMessages[userId][waUserMessages[userId].length - 1] : null;
        
        // Calculate unread count based on received messages
        let unreadCount = 0;
        if (hasMessages && userReadStatus[userId]) {
            const messages = waUserMessages[userId];
            const lastReadIndex = userReadStatus[userId].lastReadIndex;
            unreadCount = messages.slice(lastReadIndex + 1).filter(msg => msg.type === 'received').length;
            userReadStatus[userId].unreadCount = unreadCount;
        }
        
        return {
            ...user,
            hasMessages,
            lastMessage: lastMessage ? (lastMessage.text || '📎 Attachment') : 'No messages yet',
            lastTime: lastMessage ? lastMessage.time : '',
            unreadCount: unreadCount,
            sortOrder: hasMessages ? 0 : 1
        };
    });
    
    // Sort: users with messages first, then by name
    allChatUsers.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
        return a.name.localeCompare(b.name);
    });
    
    renderChatUsersList(allChatUsers);
    
    const totalEl = document.getElementById('totalUsersInChat');
    if (totalEl) totalEl.textContent = allChatUsers.length;
    
    const unreadEl = document.getElementById('unreadNotifications');
    const totalUnread = allChatUsers.reduce((sum, u) => sum + u.unreadCount, 0);
    if (unreadEl) unreadEl.textContent = totalUnread;
}

function renderChatUsersList(users) {
    const chatUsersList = document.getElementById('chatUsersList');
    if (!chatUsersList) return;
    
    if (users.length === 0) {
        chatUsersList.innerHTML = `
            <div style="padding: 3rem 1rem; text-align: center; color: #8696a0;">
                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">👥</div>
                <p>No users found</p>
            </div>
        `;
        return;
    }
    
    chatUsersList.innerHTML = users.map((user, index) => {
        const hasUnread = user.unreadCount > 0;
        const avatar = user.name.charAt(0).toUpperCase();
        const preview = user.lastMessage.substring(0, 35) + (user.lastMessage.length > 35 ? '...' : '');
        
        return `
            <div class="wa-chat-item ${hasUnread ? 'has-unread' : ''}" 
                 onclick="openWaChat('user${user.id}', '${user.name.replace(/'/g, "\\'")}', '${user.email}')"
                 style="animation: slideInMessage 0.3s ease-out ${index * 0.05}s both;">
                <div class="wa-chat-avatar">${avatar}</div>
                <div class="wa-chat-content">
                    <div class="wa-chat-top-row">
                        <span class="wa-chat-name">${user.name}</span>
                        <span class="wa-chat-time">${user.lastTime || ''}</span>
                    </div>
                    <div class="wa-chat-bottom-row">
                        <span class="wa-chat-preview">${preview}</span>
                        ${hasUnread ? `<span class="wa-unread-count">${user.unreadCount}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Filter chat users
function filterChatUsers(filter) {
    // Update active tab
    document.querySelectorAll('.wa-filter-tab').forEach(tab => tab.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    let filtered = allChatUsers;
    
    if (filter === 'unread') {
        filtered = allChatUsers.filter(u => u.unreadCount > 0);
    } else if (filter === 'groups') {
        filtered = []; // No groups yet
    }
    
    renderChatUsersList(filtered);
}

// Search chat users
function searchChatUsers() {
    const query = document.getElementById('chatUserSearch').value.toLowerCase();
    const filtered = allChatUsers.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
    );
    renderChatUsersList(filtered);
}

// Open WhatsApp-style chat
function openWaChat(userId, userName, userEmail) {
    currentWaChatUserId = userId;
    currentWaChatUserName = userName;
    currentOnlineUser = userId;
    
    // Mark user as online
    userStatus[userId] = {
        isOnline: true,
        lastSeen: new Date()
    };
    
    // Update chat header
    const nameEl = document.getElementById('waChatUserName');
    const avatarEl = document.getElementById('waChatAvatar');
    const statusEl = document.getElementById('waChatUserStatus');
    
    if (nameEl) nameEl.textContent = userName;
    if (avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase();
    
    // Update status display
    updateUserStatusDisplay(userId);
    
    // Initialize messages if not exists
    if (!waUserMessages[userId]) {
        waUserMessages[userId] = [
            { type: 'received', text: 'Hey! I need help with my project.', time: '10:30 AM', status: 'read' },
            { type: 'sent', text: 'Sure, which project are you looking for?', time: '10:32 AM', status: 'read' },
            { type: 'received', text: 'I need a CSE final year project on Machine Learning', time: '10:35 AM', status: 'read' }
        ];
    }
    
    // Mark all messages as read
    if (userReadStatus[userId]) {
        const messages = waUserMessages[userId];
        userReadStatus[userId].lastReadIndex = messages.length - 1;
        userReadStatus[userId].unreadCount = 0;
    }
    
    // Load messages
    loadWaMessages(userId);
    
    // Show active chat view
    document.getElementById('waActiveChat').style.display = 'flex';
    document.getElementById('notificationsChatArea').style.display = 'none';
    
    // Mark as active in list
    document.querySelectorAll('.wa-chat-item').forEach(item => item.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    // Clear attached files
    waAttachedFiles = [];
    updateWaAttachedPreview();
    
    // Refresh user list to update unread count
    loadChatUsers();
    
    // Focus input
    const inputEl = document.getElementById('waMessageInput');
    if (inputEl) inputEl.focus();
    
    // Scroll to bottom
    setTimeout(() => {
        const container = document.getElementById('waMessagesContainer');
        if (container) container.scrollTop = container.scrollHeight;
    }, 100);
}

// Load messages for a user
function loadWaMessages(userId) {
    const container = document.getElementById('waMessagesContainer');
    if (!container) return;
    
    const messages = waUserMessages[userId] || [];
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #8696a0;">
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    // Group messages by date
    let html = `
        <div class="wa-date-separator">
            <span>Today</span>
        </div>
    `;
    
    messages.forEach((msg, index) => {
        const statusIcon = msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓';
        const statusColor = msg.status === 'read' ? '#53bdeb' : 'rgba(255,255,255,0.6)';
        
        let fileHtml = '';
        if (msg.file) {
            // Check if it's an image
            if (msg.file.type && msg.file.type.startsWith('image/')) {
                const fileId = msg.file.id;
                const file = waFileStorage[fileId];
                if (file) {
                    fileHtml = `<img class="wa-message-image" id="wa-img-${fileId}" src="" data-file-id="${fileId}" onclick="openWaImageFromFile('${fileId}')" style="max-width: 250px; max-height: 300px; border-radius: 8px; cursor: pointer; margin-bottom: 0.4rem; display: block;">`;
                    
                    // Load image after rendering
                    setTimeout(() => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const imgEl = document.getElementById(`wa-img-${fileId}`);
                            if (imgEl) {
                                imgEl.src = e.target.result;
                            }
                        };
                        reader.readAsDataURL(file);
                    }, 10);
                } else {
                    fileHtml = `<div class="wa-message-image-placeholder" style="padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 0.4rem;">📷 Image</div>`;
                }
            }
            // Check if it's a video
            else if (msg.file.type && msg.file.type.startsWith('video/')) {
                const fileId = msg.file.id;
                const file = waFileStorage[fileId];
                if (file) {
                    fileHtml = `<video class="wa-message-video" id="wa-vid-${fileId}" src="" data-file-id="${fileId}" style="max-width: 280px; max-height: 350px; border-radius: 8px; margin-bottom: 0.4rem; display: block; background: #000;" controls></video>`;
                    
                    // Load video after rendering
                    setTimeout(() => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const vidEl = document.getElementById(`wa-vid-${fileId}`);
                            if (vidEl) {
                                vidEl.src = e.target.result;
                            }
                        };
                        reader.readAsDataURL(file);
                    }, 10);
                } else {
                    fileHtml = `<div class="wa-message-image-placeholder" style="padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 0.4rem;">📹 Video</div>`;
                }
            } else {
                // Handle different file types
                const fileType = msg.file.type || '';
                const fileName = msg.file.name || '';
                const fileIcon = getFileIcon(fileType);
                let clickAction = `downloadWaFile('${msg.file.id}')`;
                let actionText = 'Click to download';
                
                // PDF files - can preview
                if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
                    clickAction = `openWaPdfPreview('${msg.file.id}')`;
                    actionText = 'Click to preview';
                }
                // Text files - can preview
                else if (fileType.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.log')) {
                    clickAction = `openWaTextPreview('${msg.file.id}')`;
                    actionText = 'Click to preview';
                }
                
                fileHtml = `
                    <div class="wa-message-file" onclick="${clickAction}" style="cursor: pointer; padding: 0.8rem; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 0.4rem; display: flex; gap: 0.5rem; align-items: center; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                        <span class="wa-file-icon" style="font-size: 1.5rem;">${fileIcon}</span>
                        <div class="wa-file-info">
                            <div class="wa-file-name" style="font-weight: 500;">${msg.file.name}</div>
                            <div class="wa-file-size" style="font-size: 0.8rem; opacity: 0.7;">${formatFileSize(msg.file.size)}</div>
                            <div style="font-size: 0.75rem; opacity: 0.6; margin-top: 0.2rem;">${actionText}</div>
                        </div>
                    </div>
                `;
            }
        }
        
        html += `
            <div class="wa-message ${msg.type}">
                <div class="wa-message-bubble">
                    ${fileHtml}
                    ${msg.text ? `<div>${msg.text}</div>` : ''}
                    <div class="wa-message-time">
                        <span>${msg.time}</span>
                        ${msg.type === 'sent' ? `<span class="wa-message-status" style="color: ${statusColor}">${statusIcon}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Format last seen time
function formatLastSeen(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return diffMins + ' min ago';
    if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
    if (diffDays < 7) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
    
    return date.toLocaleDateString();
}

// Update user status display
function updateUserStatusDisplay(userId) {
    const statusEl = document.getElementById('waChatUserStatus');
    if (!statusEl) return;
    
    const status = userStatus[userId];
    if (status && status.isOnline) {
        statusEl.innerHTML = '<span class="wa-online-indicator"></span>online';
        statusEl.classList.add('online');
    } else if (status) {
        const lastSeenText = formatLastSeen(status.lastSeen);
        statusEl.innerHTML = lastSeenText === 'now' ? '<span class="wa-online-indicator"></span>online' : 'last seen ' + lastSeenText;
        statusEl.classList.remove('online');
    } else {
        statusEl.innerHTML = '<span class="wa-online-indicator"></span>online';
        statusEl.classList.add('online');
    }
}

// Close chat view (mobile)
function closeChatView() {
    // Mark user as offline (last seen now)
    if (currentOnlineUser) {
        userStatus[currentOnlineUser] = {
            isOnline: false,
            lastSeen: new Date()
        };
    }
    
    document.getElementById('waActiveChat').style.display = 'none';
    document.getElementById('notificationsChatArea').style.display = 'flex';
    currentWaChatUserId = null;
    currentWaChatUserName = null;
    currentOnlineUser = null;
}

// Handle file selection
function handleWaFileSelect(event) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        waFileStorage[fileId] = file;
        waAttachedFiles.push({
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type
        });
    });
    
    updateWaAttachedPreview();
    event.target.value = '';
}

// Update attached files preview
function updateWaAttachedPreview() {
    const preview = document.getElementById('waAttachedPreview');
    if (!preview) return;
    
    if (waAttachedFiles.length === 0) {
        preview.innerHTML = '';
        return;
    }
    
    preview.innerHTML = waAttachedFiles.map(file => `
        <div class="wa-attached-item">
            <span>${getFileIcon(file.type)} ${file.name.substring(0, 15)}${file.name.length > 15 ? '...' : ''}</span>
            <button class="wa-attached-remove" onclick="removeWaAttachment('${file.id}')">&times;</button>
        </div>
    `).join('');
}

// Remove attachment
function removeWaAttachment(fileId) {
    waAttachedFiles = waAttachedFiles.filter(f => f.id !== fileId);
    delete waFileStorage[fileId];
    updateWaAttachedPreview();
}

// Get file icon based on type
function getFileIcon(type) {
    if (!type) return '📄';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('doc')) return '📘';
    if (type.includes('excel') || type.includes('sheet')) return '📗';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📄';
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Handle enter key in message input
function handleWaMessageKeypress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendWaMessage();
    }
}

// Send message
function sendWaMessage() {
    const input = document.getElementById('waMessageInput');
    const text = input ? input.value.trim() : '';
    
    if (!text && waAttachedFiles.length === 0) return;
    if (!currentWaChatUserId) return;
    
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    // Add message for each attached file
    waAttachedFiles.forEach(file => {
        waUserMessages[currentWaChatUserId].push({
            type: 'sent',
            text: '',
            time: time,
            status: 'sent',
            file: {
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type
            }
        });
    });
    
    // Add text message
    if (text) {
        waUserMessages[currentWaChatUserId].push({
            type: 'sent',
            text: text,
            time: time,
            status: 'sent'
        });
    }
    
    // Clear input and attachments
    if (input) input.value = '';
    waAttachedFiles = [];
    updateWaAttachedPreview();
    
    // Reload messages
    loadWaMessages(currentWaChatUserId);
    
    // Scroll to bottom
    const container = document.getElementById('waMessagesContainer');
    setTimeout(() => {
        if (container) container.scrollTop = container.scrollHeight;
    }, 100);
    
    // Update user list
    loadChatUsers();
    
    // Simulate delivery after 1 second
    setTimeout(() => {
        const msgs = waUserMessages[currentWaChatUserId];
        if (msgs.length > 0) {
            msgs[msgs.length - 1].status = 'delivered';
            loadWaMessages(currentWaChatUserId);
        }
    }, 1000);
    
    // Simulate read after 2 seconds
    setTimeout(() => {
        const msgs = waUserMessages[currentWaChatUserId];
        if (msgs.length > 0) {
            msgs[msgs.length - 1].status = 'read';
            loadWaMessages(currentWaChatUserId);
        }
    }, 2000);
    
    // Simulate user reply after 3-5 seconds
    setTimeout(() => {
        simulateUserReply(currentWaChatUserId);
    }, 3000 + Math.random() * 2000);
}

// Simulate user reply
function simulateUserReply(userId) {
    if (!waUserMessages[userId]) return;
    
    const replies = [
        'Thanks for the quick response!',
        'That sounds great!',
        'Can you send me more details?',
        'Perfect, thank you!',
        'I appreciate your help.',
        'Could you clarify that?',
        'Yes, that works for me.',
        'Let me check and get back to you.',
        'Understood, thanks!'
    ];
    
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    waUserMessages[userId].push({
        type: 'received',
        text: randomReply,
        time: time,
        status: 'delivered'
    });
    
    // Update unread count if not viewing this chat
    if (currentWaChatUserId === userId) {
        // If viewing, mark as read immediately
        if (userReadStatus[userId]) {
            userReadStatus[userId].lastReadIndex = waUserMessages[userId].length - 1;
            userReadStatus[userId].unreadCount = 0;
        }
        loadWaMessages(userId);
        
        // Scroll to bottom
        const container = document.getElementById('waMessagesContainer');
        setTimeout(() => {
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    } else {
        // If not viewing, increment unread
        if (userReadStatus[userId]) {
            userReadStatus[userId].unreadCount++;
        }
    }
    
    // Refresh user list
    loadChatUsers();
}

// Download file
function downloadWaFile(fileId) {
    const file = waFileStorage[fileId];
    if (!file) {
        alert('File not available');
        return;
    }
    
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
}

// Open image modal from file
function openWaImageFromFile(fileId) {
    const file = waFileStorage[fileId];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        openWaImageModal(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Open image modal
function openWaImageModal(imgSrc) {
    const modal = document.getElementById('waImageModal');
    const img = document.getElementById('waImageModalImg');
    if (modal && img) {
        img.src = imgSrc;
        modal.style.display = 'flex';
    }
}

// Close image modal
function closeWaImageModal() {
    const modal = document.getElementById('waImageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Insert emoji into message input
function insertWaEmoji(emoji) {
    const input = document.getElementById('waMessageInput');
    input.value += emoji;
    input.focus();
}

// Toggle chat menu
function toggleWaChatMenu() {
    const menu = document.getElementById('waChatMenu');
    if (menu) {
        const isVisible = menu.style.display === 'block';
        menu.style.display = isVisible ? 'none' : 'block';
    }
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('waChatMenu');
    const menuBtn = e.target.closest('.wa-action-btn');
    if (menu && !menuBtn && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// Clear chat
function clearWaChat() {
    if (confirm('Clear all messages with this user?')) {
        if (currentWaChatUserId && waUserMessages[currentWaChatUserId]) {
            waUserMessages[currentWaChatUserId] = [];
            loadWaMessages(currentWaChatUserId);
            toggleWaChatMenu();
        }
    }
}

// Mute chat notifications
function muteWaChat() {
    if (!currentWaChatUserId || !currentWaChatUserName) {
        alert('Please select a user first');
        return;
    }
    
    if (confirm(`Mute notifications from ${currentWaChatUserName}?\n\nYou will not receive notifications for 8 hours.`)) {
        alert(`✓ Notifications muted for ${currentWaChatUserName}\n\nDuration: 8 hours`);
        toggleWaChatMenu();
    } else {
        toggleWaChatMenu();
    }
}

// Block user
function blockWaUser() {
    if (!currentWaChatUserId || !currentWaChatUserName) {
        alert('Please select a user first');
        return;
    }
    
    if (confirm(`Block ${currentWaChatUserName}?\n\nYou will no longer receive messages from this user. This action can be undone from settings.`)) {
        alert(`✓ ${currentWaChatUserName} has been blocked\n\nYou can unblock this user from settings.`);
        toggleWaChatMenu();
        setTimeout(() => {
            closeChatView();
        }, 300);
    } else {
        toggleWaChatMenu();
    }
}

// ===== ADMIN SUPPORT CHAT FUNCTIONS =====
function openAdminSupportChat() {
    document.getElementById('waAdminSupportChat').style.display = 'flex';
    document.getElementById('notificationsChatArea').style.display = 'none';
    document.getElementById('waActiveChat').style.display = 'none';
    loadWaAdminMessages();
    setTimeout(() => {
        const container = document.getElementById('waAdminMessagesContainer');
        if (container) container.scrollTop = container.scrollHeight;
    }, 100);
}

function closeAdminSupportChat() {
    document.getElementById('waAdminSupportChat').style.display = 'none';
    document.getElementById('notificationsChatArea').style.display = 'flex';
}

function loadWaAdminMessages() {
    const container = document.getElementById('waAdminMessagesContainer');
    if (!container) return;
    
    if (waAdminMessages.length === 0) {
        container.innerHTML = `<div style="padding: 2rem; text-align: center; color: #8696a0; font-size: 0.9rem;">No messages yet. Start your conversation!</div>`;
        return;
    }
    
    container.innerHTML = waAdminMessages.map(msg => {
        let html = `<div class="wa-message ${msg.type}">`;
        if (msg.file) {
            html += createWaFileAttachment(msg.file, msg.type);
        }
        if (msg.text) {
            html += `<div class="wa-message-bubble ${msg.type}"><span>${msg.text}</span><span class="wa-message-time">${msg.time}`;
            if (msg.type === 'sent') {
                html += ` <span class="wa-message-status">${msg.status === 'read' ? '✓✓' : '✓'}</span>`;
            }
            html += `</span></div>`;
        }
        html += `</div>`;
        return html;
    }).join('');
    
    setTimeout(() => {
        if (container) container.scrollTop = container.scrollHeight;
    }, 50);
}

function showTypingIndicator() {
    const input = document.getElementById('waMessageInput');
    if (!input || !input.value.trim()) return;
    const indicator = document.getElementById('waTypingIndicator');
    if (indicator) indicator.style.display = 'flex';
    clearTimeout(typingTimeoutUser);
    typingTimeoutUser = setTimeout(() => {
        if (indicator) indicator.style.display = 'none';
    }, 3000);
}

function showAdminTypingIndicator() {
    const input = document.getElementById('waAdminMessageInput');
    if (!input || !input.value.trim()) return;
    clearTimeout(typingTimeoutAdmin);
}

function sendWaAdminMessage() {
    const input = document.getElementById('waAdminMessageInput');
    const text = input ? input.value.trim() : '';
    
    if (!text && waAdminAttachedFiles.length === 0) return;
    
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    waAdminAttachedFiles.forEach(file => {
        waAdminMessages.push({
            type: 'sent',
            text: '',
            time: time,
            status: 'sent',
            file: {
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type
            }
        });
    });
    
    if (text) {
        waAdminMessages.push({
            type: 'sent',
            text: text,
            time: time,
            status: 'sent'
        });
    }
    
    if (input) input.value = '';
    waAdminAttachedFiles = [];
    updateWaAdminAttachedPreview();
    loadWaAdminMessages();
    
    const indicator = document.getElementById('waTypingIndicator');
    if (indicator) indicator.style.display = 'none';
    
    setTimeout(() => {
        const msgs = waAdminMessages;
        if (msgs.length > 0) {
            msgs[msgs.length - 1].status = 'delivered';
            loadWaAdminMessages();
        }
    }, 1000);
    
    setTimeout(() => {
        const msgs = waAdminMessages;
        if (msgs.length > 0 && msgs[msgs.length - 1].type === 'sent') {
            msgs[msgs.length - 1].status = 'read';
            loadWaAdminMessages();
        }
        waAdminMessages.push({
            type: 'received',
            text: 'Thanks for reaching out! Our support team will help you shortly. 😊',
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            status: 'delivered'
        });
        loadWaAdminMessages();
    }, 2000);
}

function handleWaAdminMessageKeypress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendWaAdminMessage();
    }
}

function handleWaAdminFileSelect(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        waFileStorage[fileId] = file;
        waAdminAttachedFiles.push({
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type
        });
    });
    updateWaAdminAttachedPreview();
    event.target.value = '';
}

function updateWaAdminAttachedPreview() {
    const preview = document.getElementById('waAdminAttachedPreview');
    if (!preview) return;
    
    if (waAdminAttachedFiles.length === 0) {
        preview.innerHTML = '';
        return;
    }
    
    preview.innerHTML = waAdminAttachedFiles.map(file => {
        const icon = getFileIcon(file.type);
        return `
            <div class="wa-attached-item">
                <span class="wa-attached-item-icon">${icon}</span>
                <div class="wa-attached-item-info">
                    <div class="wa-attached-item-name">${file.name}</div>
                    <div class="wa-attached-item-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="wa-attached-item-remove" onclick="removeWaAdminAttachedFile('${file.id}')">✕</button>
            </div>
        `;
    }).join('');
}

function removeWaAdminAttachedFile(fileId) {
    waAdminAttachedFiles = waAdminAttachedFiles.filter(f => f.id !== fileId);
    updateWaAdminAttachedPreview();
}

// Open PDF preview
function openWaPdfPreview(fileId) {
    const file = waFileStorage[fileId];
    if (!file) {
        alert('File not available');
        return;
    }
    
    const url = URL.createObjectURL(file);
    const modal = document.getElementById('waPdfModal');
    const pdfViewer = document.getElementById('waPdfViewer');
    
    if (modal && pdfViewer) {
        pdfViewer.src = url;
        modal.style.display = 'flex';
    } else {
        // Fallback to download if modal not available
        downloadWaFile(fileId);
    }
}

// Close PDF modal
function closeWaPdfModal() {
    const modal = document.getElementById('waPdfModal');
    const pdfViewer = document.getElementById('waPdfViewer');
    if (modal) {
        modal.style.display = 'none';
    }
    if (pdfViewer) {
        pdfViewer.src = '';
    }
}

// Open text file preview
function openWaTextPreview(fileId) {
    const file = waFileStorage[fileId];
    if (!file) {
        alert('File not available');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const modal = document.getElementById('waTextModal');
        const textContent = document.getElementById('waTextContent');
        
        if (modal && textContent) {
            textContent.textContent = text;
            textContent.style.maxHeight = '500px';
            textContent.style.overflowY = 'auto';
            modal.style.display = 'flex';
        } else {
            // Fallback to download
            downloadWaFile(fileId);
        }
    };
    reader.readAsText(file).catch(() => {
        alert('Cannot preview this file. Downloading instead...');
        downloadWaFile(fileId);
    });
}

// Close text modal
function closeWaTextModal() {
    const modal = document.getElementById('waTextModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Legacy support
let attachedFiles = [];
let fileStorage = {};
let currentChatUserId = null;
let currentChatUserName = null;
let userMessages = {};

function selectChatUser(element, userId, userName, userEmail, userCollege) {
    openWaChat(userId, userName, userEmail);
}

function openUserChat(userId, userName) {
    // Redirect to WhatsApp style chat
    const userEmail = '';
    openWaChat(userId, userName, userEmail);
}

function loadUserMessages(userId) {
    loadWaMessages(userId);
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

// Order search functions
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
