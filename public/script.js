let cart = [];
let allProjects = [];

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
        const query = prompt('Search projects by name, subject, or college:');
        if (query && query.trim() !== '') {
            const searchTerm = query.toLowerCase().trim();
            const filtered = allProjects.filter(project => 
                project.topic.toLowerCase().includes(searchTerm) ||
                project.subject.toLowerCase().includes(searchTerm) ||
                project.college.toLowerCase().includes(searchTerm)
            );
            displayProjects(filtered);
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
    document.getElementById('productDetail').style.display = 'block';
    document.getElementById('detailImage').src = `https://via.placeholder.com/500x400?text=${encodeURIComponent(project.topic)}`;
    document.getElementById('detailName').textContent = project.topic;
    document.getElementById('detailPrice').textContent = `₹${project.price}`;
    window.scrollTo(0, 0);
}

function backToProjects() {
    document.getElementById('productDetail').style.display = 'none';
    document.getElementById('projects').style.display = 'block';
    currentProductDetail = null;
}

function addToCartFromDetail() {
    if (currentProductDetail) {
        addToCart(currentProductDetail.id, currentProductDetail.topic, currentProductDetail.price, currentProductDetail.college);
        backToProjects();
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

// Open cart
function openCart() {
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

// Display cart items
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
