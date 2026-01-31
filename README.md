# Online Cases Store - Advanced NoSQL Database Project

**Authors:** ...  

---

## Project Description

**Online Cases Store** - A full-featured web application for selling phone cases, laptop cases, and tablet cases. The project demonstrates advanced NoSQL database concepts using MongoDB.

### Key Features:
- Online store with product catalog
- Authentication and authorization system (users and administrators)
- Shopping cart and order checkout
- Review and rating system
- Sales analytics and statistics
- Order management and status tracking

---

## Course Requirements Compliance

### Project Format
- **Type:** Web Application
- **Team Size:** 1 student
- **Backend + Frontend:** Both implemented
- **Database:** MongoDB (NoSQL)

### REST API (Required minimum 8, Implemented 34)

#### Endpoints by Category:

**Authentication (3):**
1. `POST /api/auth/register` - User registration
2. `POST /api/auth/login` - User login
3. `GET /api/auth/me` - Get current user

**Products (8):**
4. `GET /api/products` - Get all products (with filtering, sorting, pagination)
5. `GET /api/products/:id` - Get single product
6. `POST /api/products` - Create product (Admin)
7. `PUT /api/products/:id` - Update product (Admin)
8. `PATCH /api/products/:id/stock` - Update stock via $inc (Admin)
9. `PATCH /api/products/:id/tags` - Add tag via $push (Admin)
10. `DELETE /api/products/:id/tags/:tag` - Remove tag via $pull (Admin)
11. `DELETE /api/products/:id` - Delete product (Admin)

**Reviews (5):**
12. `GET /api/reviews/products/:productId` - Get product reviews
13. `POST /api/reviews` - Create review
14. `PUT /api/reviews/:id` - Update review
15. `PATCH /api/reviews/:id/helpful` - Mark review as helpful ($push, $inc)
16. `DELETE /api/reviews/:id` - Delete review

**Orders (6):**
17. `POST /api/orders` - Create order
18. `GET /api/orders` - Get user orders
19. `GET /api/orders/all` - Get all orders (Admin)
20. `GET /api/orders/:id` - Get single order
21. `PATCH /api/orders/:id/status` - Update order status ($set, $push) (Admin)
22. `DELETE /api/orders/:id` - Cancel order

**Users (7):**
23. `GET /api/users/:id` - Get user profile
24. `PUT /api/users/:id` - Update profile ($set)
25. `POST /api/users/:id/addresses` - Add address ($push)
26. `DELETE /api/users/:id/addresses/:addressId` - Remove address ($pull)
27. `POST /api/users/cart` - Add to cart ($push or positional $)
28. `DELETE /api/users/cart/:productId` - Remove from cart ($pull)
29. `DELETE /api/users/cart` - Clear cart

**Analytics (5) - Aggregation Endpoints:**
30. `GET /api/analytics/products/stats` - Product statistics (aggregation)
31. `GET /api/analytics/products/top-rated` - Top products (aggregation)
32. `GET /api/analytics/sales` - Sales analytics ($lookup, $unwind) (Admin)
33. `GET /api/analytics/users/:userId/orders` - User order history (aggregation)
34. `GET /api/analytics/reviews/stats` - Review statistics (aggregation)

**Total: 34 REST API Endpoints** (exceeds requirement of 8)

---

## MongoDB Implementation (50 points)

### 1. CRUD Operations (8 points)

**4 collections with full CRUD:**

#### Users Collection
- **Create:** User registration (`POST /api/auth/register`)
- **Read:** Get profile (`GET /api/users/:id`, `GET /api/auth/me`)
- **Update:** Update profile (`PUT /api/users/:id`)
- **Delete:** Account deactivation (via `isActive` field)

#### Products Collection
- **Create:** `POST /api/products` (Admin)
- **Read:** `GET /api/products`, `GET /api/products/:id`
- **Update:** `PUT /api/products/:id` (Admin)
- **Delete:** `DELETE /api/products/:id` (Admin)

#### Orders Collection
- **Create:** `POST /api/orders` (create order)
- **Read:** `GET /api/orders`, `GET /api/orders/:id`
- **Update:** `PATCH /api/orders/:id/status` (update status)
- **Delete:** `DELETE /api/orders/:id` (cancel order)

#### Reviews Collection
- **Create:** `POST /api/reviews`
- **Read:** `GET /api/reviews/products/:productId`
- **Update:** `PUT /api/reviews/:id`
- **Delete:** `DELETE /api/reviews/:id`

---

### 2. Data Modeling (8 points)

#### Embedded Documents:

**In Users Collection:**
```javascript
{
  addresses: [{
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean
  }],
  cart: [{
    product: ObjectId,
    quantity: Number,
    addedAt: Date
  }]
}
```

**In Products Collection:**
```javascript
{
  specifications: {
    material: String,
    color: String,
    compatibility: [String],
    dimensions: { length, width, height, unit },
    weight: { value, unit },
    features: [String]
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean
  }]
}
```

**In Orders Collection:**
```javascript
{
  items: [{
    product: ObjectId,
    productSnapshot: {
      name: String,
      price: Number,
      image: String
    },
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  shippingAddress: {
    name, street, city, state, zipCode, country, phone
  }
}
```

#### Referenced Documents:

```javascript
// Orders -> Users
order.user: ObjectId (ref: 'User')

// Reviews -> Users & Products
review.user: ObjectId (ref: 'User')
review.product: ObjectId (ref: 'Product')

// Cart -> Products
user.cart[].product: ObjectId (ref: 'Product')
```

**Design Rationale:**
- **Embedded:** Used for data that is always read together and does not change independently
- **Referenced:** Used for relationships between independent entities
- **Hybrid (Orders):** Combination - reference to product + data snapshot to preserve price history

---

### 3. Advanced Update/Delete Operators

#### $set - Update fields
```javascript
// Update product (productController.js)
Product.findByIdAndUpdate(id, { $set: req.body })

// Update order status (orderController.js)
Order.findByIdAndUpdate(id, { 
  $set: { orderStatus, trackingNumber, deliveredAt } 
})

// Update profile (userController.js)
User.findByIdAndUpdate(id, { $set: { name, phone } })
```

#### $inc - Increment/decrement
```javascript
// Update product stock (productController.js)
Product.findByIdAndUpdate(id, { 
  $inc: { stock: quantity }  // can be negative
})

// When creating order (orderController.js)
Product.findByIdAndUpdate(id, {
  $inc: { 
    stock: -quantity,      // decrease stock
    soldCount: quantity    // increase sold count
  }
})

// Count helpful reviews (reviewController.js)
Review.findByIdAndUpdate(id, {
  $inc: { 'helpful.count': 1 }
})
```

#### $push - Add to array
```javascript
// Add address (userController.js)
User.findByIdAndUpdate(id, {
  $push: { addresses: newAddress }
})

// Add tag to product (productController.js)
Product.findByIdAndUpdate(id, {
  $push: { tags: tag }
})


// Add user to "helpful" list (reviewController.js)
Review.findByIdAndUpdate(id, {
  $push: { 'helpful.users': userId }
})

// Add to cart (userController.js)
User.findByIdAndUpdate(id, {
  $push: { cart: { product, quantity } }
})
```

#### $pull - Remove from array
```javascript
// Remove address (userController.js)
User.findByIdAndUpdate(id, {
  $pull: { addresses: { _id: addressId } }
})

// Remove tag (productController.js)
Product.findByIdAndUpdate(id, {
  $pull: { tags: tag }
})

// Remove from cart (userController.js)
User.findByIdAndUpdate(id, {
  $pull: { cart: { product: productId } }
})
```

#### Positional $ - Update specific array element
```javascript
// Update cart item quantity (userController.js)
User.findOneAndUpdate(
  { _id: userId, 'cart.product': productId },
  { $inc: { 'cart.$.quantity': quantity } }
)
```

---

### 4. Aggregation Framework (10 points)

#### Pipeline 1: Product Statistics (analyticsController.js)
```javascript
Product.aggregate([
  {
    $match: { isActive: true }
  },
  {
    $group: {
      _id: '$category',
      totalProducts: { $sum: 1 },
      averagePrice: { $avg: '$price' },
      totalStock: { $sum: '$stock' },
      totalSold: { $sum: '$soldCount' },
      averageRating: { $avg: '$rating.average' }
    }
  },
  {
    $sort: { totalSold: -1 }
  }
])
```
**Business Purpose:** Category-based inventory analysis for purchasing decisions

#### Pipeline 2: Top-rated Products with Weighted Score
```javascript
Product.aggregate([
  {
    $match: { 
      isActive: true,
      'rating.count': { $gte: 1 }
    }
  },
  {
    $project: {
      name: 1,
      price: 1,
      rating: 1,
      score: {
        $multiply: [
          '$rating.average',
          { $ln: { $add: ['$rating.count', 1] } }
        ]
      }
    }
  },
  {
    $sort: { score: -1 }
  },
  {
    $limit: 10
  }
])
```
**Business Purpose:** Fair product ranking considering review count

#### Pipeline 3: Sales Analytics with $lookup and $unwind
```javascript
Order.aggregate([
  {
    $match: { 
      orderStatus: { $nin: ['cancelled'] },
      paymentStatus: 'completed'
    }
  },
  {
    $unwind: '$items'  // Unwind items array
  },
  {
    $lookup: {  // Join product information
      from: 'products',
      localField: 'items.product',
      foreignField: '_id',
      as: 'productDetails'
    }
  },
  {
    $unwind: '$productDetails'
  },
  {
    $group: {
      _id: {
        productId: '$items.product',
        productName: '$productDetails.name',
        category: '$productDetails.category'
      },
      totalQuantity: { $sum: '$items.quantity' },
      totalRevenue: { $sum: '$items.subtotal' },
      orderCount: { $sum: 1 },
      averagePrice: { $avg: '$items.price' }
    }
  },
  {
    $sort: { totalRevenue: -1 }
  },
  {
    $limit: 20
  }
])
```
**Business Purpose:** Identifying most profitable products for inventory optimization

#### Pipeline 4: User Order History
```javascript
Order.aggregate([
  {
    $match: { user: ObjectId(userId) }
  },
  {
    $lookup: {
      from: 'products',
      localField: 'items.product',
      foreignField: '_id',
      as: 'productDetails'
    }
  },
  {
    $project: {
      orderNumber: 1,
      orderStatus: 1,
      createdAt: 1,
      'pricing.total': 1,
      itemCount: { $size: '$items' },
      items: {
        $map: {
          input: '$items',
          as: 'item',
          in: {
            productName: '$$item.productSnapshot.name',
            quantity: '$$item.quantity',
            subtotal: '$$item.subtotal'
          }
        }
      }
    }
  },
  {
    $sort: { createdAt: -1 }
  }
])
```
**Business Purpose:** Personalized purchase history for CRM and marketing

#### Pipeline 5: Review Rating Distribution
```javascript
Review.aggregate([
  {
    $match: { isActive: true }
  },
  {
    $group: {
      _id: '$rating',
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: -1 }
  }
])
```
**Business Purpose:** Customer satisfaction and product quality analysis

---

### 5. Indexes and Optimization (6 points)

#### Compound Indexes:

**Products Collection:**
```javascript
// 1. For filtering by category and price
productSchema.index({ category: 1, price: 1 });

// 2. For sorting by rating and popularity
productSchema.index({ 'rating.average': -1, soldCount: -1 });

// 3. For active products
productSchema.index({ isActive: 1, createdAt: -1 });
```

**Orders Collection:**
```javascript
// 4. For user order history
orderSchema.index({ user: 1, createdAt: -1 });

// 5. For admin order filtering
orderSchema.index({ orderStatus: 1, paymentStatus: 1 });
```

**Users Collection:**
```javascript
// 6. For authentication
userSchema.index({ email: 1, isActive: 1 });

// 7. For admin panel
userSchema.index({ role: 1, createdAt: -1 });
```

**Reviews Collection:**
```javascript
// 8. For product reviews with sorting
reviewSchema.index({ product: 1, rating: -1 });

// 9. Unique constraint - one review per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// 10. For recent reviews
reviewSchema.index({ product: 1, createdAt: -1 });
```

**Text Search Index:**
```javascript
// 11. Full-text search for products
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});
```

**Performance Rationale:**
- Queries with category and price filtering use index `{category: 1, price: 1}`
- Top products search uses index `{rating.average: -1, soldCount: -1}`
- User order history uses index `{user: 1, createdAt: -1}`
- All indexes cover frequent application queries

---

### 6. Authentication & Authorization

```javascript
// JWT tokens with bcrypt password hashing
// Roles: user, admin
// Middleware for protecting endpoints (middleware/auth.js)

// Protected route
router.get('/orders', protect, getMyOrders);

// Admin-only route
router.post('/products', protect, restrictTo('admin'), createProduct);
```

---

## Features

### Backend Features
- RESTful API with Express.js
- MongoDB with Mongoose ODM
- JWT authentication & role-based authorization
- Advanced CRUD operations across multiple collections
- Complex aggregation pipelines for analytics
- Compound indexes for performance optimization
- Embedded and referenced data models
- Advanced operators: $set, $push, $pull, $inc
- Centralized error handling
- Environment-based configuration

### Frontend Features
- 5 responsive pages (Home, Products, Cart, Dashboard, Login)
- Card-based UI for product display
- Product filtering, sorting, and search
- Shopping cart functionality
- User authentication
- Order management dashboard
- Real-time API integration

## System Architecture

```
┌─────────────────┐
│   Frontend      │
│  (HTML/CSS/JS)  │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   Express API   │
│   (Node.js)     │
└────────┬────────┘
         │ Mongoose ODM
         ▼
┌─────────────────┐
│    MongoDB      │
│   (NoSQL DB)    │
└─────────────────┘
```

## Database Schema

### Collections

#### 1. Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: String (enum: user, admin),
  phone: String,
  // Embedded addresses
  addresses: [{
    street, city, state, zipCode, country, isDefault
  }],
  // Embedded cart
  cart: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    addedAt: Date
  }],
  isActive: Boolean,
  lastLogin: Date,
  timestamps: true
}
```

**Indexes:**
- `{ email: 1, isActive: 1 }` - Compound index for login queries
- `{ role: 1, createdAt: -1 }` - Admin user filtering

#### 2. Products Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String (enum, indexed),
  price: Number,
  discountPrice: Number,
  stock: Number,
  // Embedded specifications
  specifications: {
    material, color, compatibility[], dimensions, weight, features[]
  },
  images: [{ url, alt, isPrimary }],
  brand: String,
  rating: { average: Number, count: Number },
  isActive: Boolean,
  tags: [String],
  soldCount: Number,
  timestamps: true
}
```

**Indexes:**
- `{ category: 1, price: 1 }` - Compound index for filtered queries
- `{ 'rating.average': -1, soldCount: -1 }` - Top products
- `{ name: 'text', description: 'text', tags: 'text' }` - Text search
- `{ isActive: 1, createdAt: -1 }` - Active products listing

#### 3. Reviews Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  product: ObjectId (ref: Product),
  rating: Number (1-5),
  title: String,
  comment: String,
  images: [{ url, caption }],
  helpful: {
    count: Number,
    users: [ObjectId]
  },
  verified: Boolean,
  isActive: Boolean,
  timestamps: true
}
```

**Indexes:**
- `{ product: 1, rating: -1 }` - Product reviews sorted by rating
- `{ user: 1, product: 1 }` - Unique constraint (one review per user per product)
- `{ product: 1, createdAt: -1 }` - Recent reviews

#### 4. Orders Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  orderNumber: String (unique),
  // Embedded order items with product snapshots
  items: [{
    product: ObjectId,
    productSnapshot: { name, price, image },
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  // Embedded shipping address
  shippingAddress: {
    name, street, city, state, zipCode, country, phone
  },
  paymentMethod: String,
  paymentStatus: String (enum),
  orderStatus: String (enum),
  pricing: {
    subtotal, shipping, discount, total
  },
  trackingNumber: String,
  deliveredAt: Date,
  cancelledAt: Date,
  timestamps: true
}
```

**Indexes:**
- `{ user: 1, createdAt: -1 }` - User order history
- `{ orderNumber: 1 }` - Order lookup
- `{ orderStatus: 1, paymentStatus: 1 }` - Admin filtering
- `{ createdAt: -1 }` - Recent orders

## API Endpoints

### Authentication (3 endpoints)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (Protected)

### Products (7 endpoints)
- `GET /api/products` - Get all products (with filters, pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `PATCH /api/products/:id/stock` - Update stock with $inc (Admin)
- `PATCH /api/products/:id/tags` - Add tag with $push (Admin)
- `DELETE /api/products/:id/tags/:tag` - Remove tag with $pull (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Reviews (5 endpoints)
- `GET /api/reviews/products/:productId` - Get product reviews
- `POST /api/reviews` - Create review (Protected)
- `PUT /api/reviews/:id` - Update review (Protected)
- `PATCH /api/reviews/:id/helpful` - Mark helpful with $push, $inc (Protected)
- `DELETE /api/reviews/:id` - Delete review (Protected)

### Orders (6 endpoints)
- `POST /api/orders` - Create order (Protected)
- `GET /api/orders` - Get user orders (Protected)
- `GET /api/orders/all` - Get all orders (Admin)
- `GET /api/orders/:id` - Get single order (Protected)
- `PATCH /api/orders/:id/status` - Update order status with $set, $push (Admin)
- `DELETE /api/orders/:id` - Cancel order (Protected)

### Users (7 endpoints)
- `GET /api/users/:id` - Get user profile (Protected)
- `PUT /api/users/:id` - Update profile with $set (Protected)
- `POST /api/users/:id/addresses` - Add address with $push (Protected)
- `DELETE /api/users/:id/addresses/:addressId` - Remove address with $pull (Protected)
- `POST /api/users/cart` - Add to cart with $push or positional $ (Protected)
- `DELETE /api/users/cart/:productId` - Remove from cart with $pull (Protected)
- `DELETE /api/users/cart` - Clear cart (Protected)

### Analytics (5 endpoints)
- `GET /api/analytics/products/stats` - Product statistics aggregation (Admin)
- `GET /api/analytics/products/top-rated` - Top rated products aggregation
- `GET /api/analytics/sales` - Sales analytics with $lookup, $unwind (Admin)
- `GET /api/analytics/users/:userId/orders` - User order history aggregation (Protected)
- `GET /api/analytics/reviews/stats` - Review statistics aggregation

**Total: 33 REST API Endpoints**

## Advanced MongoDB Features

### 1. Aggregation Pipelines

#### Product Statistics
```javascript
Product.aggregate([
  { $match: { isActive: true } },
  { $group: {
      _id: '$category',
      totalProducts: { $sum: 1 },
      averagePrice: { $avg: '$price' },
      totalStock: { $sum: '$stock' },
      totalSold: { $sum: '$soldCount' },
      averageRating: { $avg: '$rating.average' }
  }},
  { $sort: { totalSold: -1 } }
])
```

#### Sales Analytics
```javascript
Order.aggregate([
  { $match: { orderStatus: { $nin: ['cancelled'] } } },
  { $unwind: '$items' },
  { $lookup: {
      from: 'products',
      localField: 'items.product',
      foreignField: '_id',
      as: 'productDetails'
  }},
  { $unwind: '$productDetails' },
  { $group: {
      _id: '$items.product',
      totalQuantity: { $sum: '$items.quantity' },
      totalRevenue: { $sum: '$items.subtotal' }
  }},
  { $sort: { totalRevenue: -1 } }
])
```

### 2. Advanced Update Operators

- **$set** - Update product details, order status
- **$inc** - Increment/decrement stock, helpful count
- **$push** - Add items to cart, tags, addresses
- **$pull** - Remove items from cart, tags, addresses
- **Positional $** - Update specific cart item quantity

### 3. Compound Indexes

```javascript
// Product queries optimization
{ category: 1, price: 1 }
{ 'rating.average': -1, soldCount: -1 }

// User order history
{ user: 1, createdAt: -1 }

// Review filtering
{ product: 1, rating: -1 }
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
```bash
cd /home/danilrey/WebstormProjects/online_cases_store
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env
```

Edit `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/online_store
JWT_SECRET=your_secure_jwt_secret_here
PORT=3000
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod
```

5. **Seed the database**
```bash
npm run seed
```

6. **Start the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

7. **Access the application**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

## Test Accounts

After seeding, use these accounts:

**Admin Account:**
- Email: `admin@casesstore.com`
- Password: `admin1`

**Customer Accounts:**
- Email: `alex1@casesstore.com`, `sam2@casesstore.com`, `jamie3@casesstore.com`, `taylor4@casesstore.com`, `riley5@casesstore.com`
- Password: `1234`

## Frontend Pages

1. **Home Page** (`/`)
   - Hero section
   - Featured products
   - Categories
   - Top-rated products

2. **Products Page** (`/products.html`)
   - Product grid with cards
   - Category filtering
   - Price sorting
   - Search functionality
   - Pagination

3. **Shopping Cart** (`/cart.html`)
   - Cart items display
   - Quantity controls
   - Order summary
   - Checkout functionality

4. **User Dashboard** (`/dashboard.html`)
   - Profile information
   - Order history
   - Order filtering by status
   - Order cancellation

5. **Login/Register** (`/login.html`)
   - User authentication
   - New user registration

## UI/UX Features

- Responsive card-based design
- Modern gradient backgrounds
- Smooth transitions and hover effects
- Real-time cart counter
- Alert notifications
- Empty states handling
- Loading indicators
- Order status badges
- Discount badges on products

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based authorization (user/admin)
- Protected routes middleware
- Input validation with validator.js
- MongoDB injection prevention

## Performance Optimizations

1. **Database Indexes**
   - Compound indexes on frequently queried fields
   - Text indexes for search functionality
   - Unique indexes for data integrity

2. **Query Optimization**
   - Selective field projection
   - Pagination for large datasets
   - Aggregation pipeline optimization

3. **Caching Strategy**
   - Client-side auth token storage
   - Product data caching in frontend

## Testing the Application

### Test Scenarios

1. **User Registration & Login**
   - Register a new account
   - Login with credentials
   - View dashboard

2. **Product Browsing**
   - Browse all products
   - Filter by category
   - Sort by price/rating
   - Search products

3. **Shopping Cart**
   - Add products to cart
   - Update quantities
   - Remove items
   - Proceed to checkout

4. **Order Management**
   - Place an order
   - View order history
   - Cancel pending orders

5. **Admin Features** (Login as admin)
   - View analytics
   - Manage products
   - Update order status

## Project Structure

```
online_cases_store/
├── src/
│   ├── controllers/      # Request handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & error handling
│   └── seed/           # Database seeding
├── public/
│   ├── css/            # Stylesheets
│   ├── js/             # Frontend JavaScript
│   ├── index.html      # Home page
│   ├── products.html   # Products page
│   ├── cart.html       # Cart page
│   ├── dashboard.html  # User dashboard
│   └── login.html      # Auth page
├── server.js           # Express server
├── package.json        # Dependencies
└── .env               # Environment variables
```

## Academic Requirements Met

**Database Requirements:**
- CRUD operations across 4 collections
- Embedded documents (addresses, cart, specifications)
- Referenced documents (user-orders, product-reviews)
- Advanced operators ($set, $push, $pull, $inc, positional $)
- Multi-stage aggregation pipelines (5+ pipelines)
- Compound indexes (6+ indexes)
- Authentication & authorization

**Backend Requirements:**
- RESTful API with 33 endpoints
- MongoDB as primary database
- Meaningful business logic
- Full CRUD functionality
- Aggregation-based endpoints
- Advanced update/delete operations

**Frontend Requirements:**
- 5 functional pages
- Card-based UI
- API integration
- Basic usability
- Visual consistency

## Bonus Features Implemented

- Environment configuration (.env)
- Centralized error handling
- Pagination, filtering, sorting
- JWT authentication
- Role-based authorization
- Password hashing
- Input validation
- Compound indexes
- Text search
- Advanced aggregations

## API Documentation Example

### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "phone": "+1234567890"
  },
  "paymentMethod": "credit-card",
  "pricing": {
    "subtotal": 79.98,
    "shipping": 5.00,
    "total": 92.97
  }
}
```

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify MongoDB port (default: 27017)

**Authentication Issues:**
- Clear localStorage in browser
- Check JWT_SECRET in .env
- Verify token expiration (30 days default)

**Port Already in Use:**
- Change PORT in .env
- Kill process using port 3000: `lsof -ti:3000 | xargs kill`

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcryptjs
- **Validation:** validator.js
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Dev Tools:** nodemon, dotenv