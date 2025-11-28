let cart = [];
let allProducts = [];
let currentFilter = 'All';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    document.querySelector('.cart-icon').addEventListener('click', openCart);
    loadCartFromStorage();
    updateCartCount();
});

// Fetch products from API
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        allProducts = await response.json();
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Display products
function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">${product.image}</div>
            <div class="product-content">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-price">₹${product.price}</div>
                <button class="product-button" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                    Add to Cart
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Filter products
function filterProducts(category) {
    currentFilter = category;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter and display
    const filtered = category === 'All' 
        ? allProducts 
        : allProducts.filter(p => p.category === category);
    displayProducts(filtered);
}

// Add to cart
function addToCart(id, name, price) {
    cart.push({ id, name, price, quantity: 1 });
    saveCartToStorage();
    updateCartCount();
    alert(`${name} added to cart!`);
}

// Update cart count
function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.length;
}

// Open cart modal
function openCart() {
    const modal = document.getElementById('cartModal');
    modal.style.display = 'block';
    displayCart();
}

// Close cart modal
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
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price}</div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">Remove</button>
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
    alert(`Order placed! Total: ₹${total}\n\nThank you for shopping at ShopHub!`);
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
        cart = JSON.parse(saved);
    }
}

// Close modal on outside click
window.addEventListener('click', (event) => {
    const modal = document.getElementById('cartModal');
    if (event.target === modal) {
        closeCart();
    }
});
