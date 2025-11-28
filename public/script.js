let cart = [];
let allProjects = [];
let favorites = [];

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
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No projects found.</p>';
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
        openCart();
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
