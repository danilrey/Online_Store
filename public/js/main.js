// Main page functionality
document.addEventListener('DOMContentLoaded', async () => {
    await loadFeaturedProducts();
    await loadTopRatedProducts();
});

async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');

    try {
        const result = await api.getProducts({ limit: 4, sort: '-soldCount' });

        if (result.success && result.data.length > 0) {
            container.innerHTML = result.data.map(product => createProductCard(product)).join('');
        } else {
            container.innerHTML = '<p class="empty-state">No products available</p>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p class="empty-state">Error loading products</p>';
    }
}

async function loadTopRatedProducts() {
    const container = document.getElementById('top-rated-products');

    try {
        const result = await api.getTopRated();

        if (result.success && result.data.length > 0) {
            container.innerHTML = result.data.map(product => createProductCard(product)).join('');
        } else {
            container.innerHTML = '<p class="empty-state">No top rated products yet</p>';
        }
    } catch (error) {
        console.error('Error loading top rated products:', error);
        container.innerHTML = '<p class="empty-state">Error loading products</p>';
    }
}

function createProductCard(product) {
    const effectivePrice = product.discountPrice || product.price;
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const discount = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

    return `
        <div class="product-card" onclick="viewProduct('${product._id}')">
            ${hasDiscount ? `<div class="product-badge">-${discount}%</div>` : ''}
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
                        <span class="current-price">${formatPrice(effectivePrice)}</span>
                        ${hasDiscount ? `<span class="original-price">${formatPrice(product.price)}</span>` : ''}
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

// Update cart count on page load
updateCartCount();
