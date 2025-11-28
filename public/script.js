let cart = [];
let allProjects = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchProjects();
    fetchFilterOptions();
    document.querySelector('.cart-icon').addEventListener('click', openCart);
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

// Fetch filter options
async function fetchFilterOptions() {
    try {
        const [subjResponse, collegeResponse] = await Promise.all([
            fetch('/api/subjects'),
            fetch('/api/colleges')
        ]);
        
        const subjects = await subjResponse.json();
        const colleges = await collegeResponse.json();
        
        populateFilters(subjects, colleges);
    } catch (error) {
        console.error('Error fetching filter options:', error);
    }
}

// Populate filter dropdowns
function populateFilters(subjects, colleges) {
    const subjectFilter = document.getElementById('subjectFilter');
    const collegeFilter = document.getElementById('collegeFilter');
    
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectFilter.appendChild(option);
    });
    
    colleges.forEach(college => {
        const option = document.createElement('option');
        option.value = college;
        option.textContent = college;
        collegeFilter.appendChild(option);
    });
}

// Display projects
function displayProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '';
    
    if (projects.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No projects found matching your filters.</p>';
        return;
    }
    
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-header">
                <div class="project-meta">
                    <div class="project-subject">${project.subject}</div>
                    <div class="project-college">${project.college}</div>
                </div>
                <div class="project-badge">📥 ${project.downloads}</div>
            </div>
            <div class="project-content">
                <div class="project-topic">${project.topic}</div>
                <div class="project-info">
                    <span>📄 ${project.file}</span>
                    <span>⭐ ${Math.floor(Math.random() * 2) + 4}.0</span>
                </div>
                <div class="project-price">₹${project.price}</div>
                <div class="project-buttons">
                    <button class="project-btn-add" onclick="addToCart(${project.id}, '${project.topic}', ${project.price}, '${project.college}')">
                        Add to Cart
                    </button>
                    <button class="project-btn-preview" onclick="previewProject('${project.topic}')">
                        Preview
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Apply filters
function applyFilters() {
    const subjectFilter = document.getElementById('subjectFilter').value;
    const collegeFilter = document.getElementById('collegeFilter').value;
    
    let filtered = allProjects;
    
    if (subjectFilter) {
        filtered = filtered.filter(p => p.subject === subjectFilter);
    }
    
    if (collegeFilter) {
        filtered = filtered.filter(p => p.college === collegeFilter);
    }
    
    displayProjects(filtered);
}

// Reset filters
function resetFilters() {
    document.getElementById('subjectFilter').value = '';
    document.getElementById('collegeFilter').value = '';
    displayProjects(allProjects);
}

// Preview project
function previewProject(topic) {
    alert(`Preview: ${topic}\n\nThis will show project details, specifications, and requirements.`);
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
    modal.style.display = 'block';
    displayCart();
}

// Close cart
function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
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
