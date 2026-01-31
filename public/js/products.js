// Products page functionality
let currentPage = 1;
let currentFilters = {
    category: '',
    sort: '-createdAt',
    search: ''
};

document.addEventListener('DOMContentLoaded', () => {
    // Get URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('category')) {
        currentFilters.category = urlParams.get('category');
        document.getElementById('category').value = currentFilters.category;
    }

    // Setup event listeners
    document.getElementById('category').addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        currentPage = 1;
        loadProducts();
    });

    document.getElementById('sort').addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        currentPage = 1;
        loadProducts();
    });

    let searchTimeout;
    document.getElementById('search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = e.target.value;
            currentPage = 1;
            loadProducts();
        }, 500);
    });

    loadProducts();
});

async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<div class="loading">Loading products...</div>';

    try {
        const params = {
            page: currentPage,
            limit: 12,
            ...currentFilters
        };

        // Remove empty params
        Object.keys(params).forEach(key => {
            if (!params[key]) delete params[key];
        });

        const result = await api.getProducts(params);

        if (result.success && result.data.length > 0) {
            container.innerHTML = result.data.map(product => createProductCard(product)).join('');
            renderPagination(result.pages, result.currentPage);
        } else {
            container.innerHTML = '<p class="empty-state">No products found</p>';
            document.getElementById('pagination').innerHTML = '';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p class="empty-state">Error loading products</p>';
    }
}

function createProductCard(product) {
    return `
        <div class="product-card" onclick="viewProduct('${product._id}')">
            <div class="product-image">
                ${getProductImage(product)}
            </div>
            <div class="product-content">
                <div class="product-category">${product.category.replace('-', ' ')}</div>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-rating">
                    <span class="stars">${getStars(product.rating?.average || 0)}</span>
                    <span class="rating-count">(${product.rating?.count || 0})</span>
                </div>
                <div class="product-footer">
                    <div class="product-price">
                        <span class="current-price">${formatPrice(product.price)}</span>
                    </div>
                    <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${product._id}')">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
}

function viewProduct(productId) {
    window.location.href = `/product.html?id=${productId}`;
}

function renderPagination(totalPages, current) {
    const container = document.getElementById('pagination');

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    if (current > 1) {
        html += `<button onclick="changePage(${current - 1})">Previous</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= current - 2 && i <= current + 2)) {
            html += `<button class="${i === current ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === current - 3 || i === current + 3) {
            html += `<span>...</span>`;
        }
    }

    if (current < totalPages) {
        html += `<button onclick="changePage(${current + 1})">Next</button>`;
    }

    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function addToCart(productId) {
    if (!isAuthenticated()) {
        showAlert('Please login to add items to cart', 'error');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
        return;
    }

    try {
        const result = await api.addToCart(productId, 1, authToken);

        if (result.success) {
            showAlert('Product added to cart!', 'success');
            updateCartCount();
        } else {
            showAlert(result.message || 'Error adding to cart', 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showAlert('Error adding to cart', 'error');
    }
}

async function updateCartCount() {
    if (!isAuthenticated()) return;

    try {
        const result = await api.getMe(authToken);
        if (result.success && result.data.cart) {
            const count = result.data.cart.reduce((sum, item) => sum + item.quantity, 0);
            const badge = document.getElementById('cart-count');
            if (badge) {
                badge.textContent = count;
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

updateCartCount();
