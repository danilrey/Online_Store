# Online Cases Store - Advanced NoSQL Database Project

**Authors:** ...

---

## Project Description
Online Cases Store is a web app for selling phone, laptop, and tablet cases. It demonstrates advanced NoSQL concepts with MongoDB, including embedded/referenced models, aggregations, and indexes.

### Key Features
- Product catalog with filtering/sorting/search
- Auth and role-based access (user/admin)
- Cart, orders, and order status updates
- Reviews and ratings
- Analytics dashboards

---

## Requirements Mapping
- **Web app with backend + frontend:** implemented
- **MongoDB (NoSQL):** implemented with Mongoose
- **REST API:** implemented (36 endpoints)
- **CRUD + advanced updates:** implemented across multiple collections
- **Aggregation endpoints:** implemented in analytics routes
- **Indexes:** compound + text indexes in models
- **Auth & authorization:** JWT + role-based middleware
- **Frontend pages:** 7 pages

---

## REST API Overview

### Authentication (3)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Products (8)
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `PATCH /api/products/:id/stock` (admin)
- `PATCH /api/products/:id/tags` (admin)
- `DELETE /api/products/:id/tags/:tag` (admin)
- `DELETE /api/products/:id` (admin)

### Reviews (4)
- `GET /api/reviews/products/:productId`
- `POST /api/reviews` (protected)
- `PUT /api/reviews/:id` (protected)
- `DELETE /api/reviews/:id` (protected)

### Orders (6)
- `POST /api/orders` (protected)
- `GET /api/orders` (protected)
- `GET /api/orders/all` (admin)
- `GET /api/orders/:id` (protected)
- `PATCH /api/orders/:id/status` (admin)
- `DELETE /api/orders/:id` (protected)

### Users (7)
- `GET /api/users/:id` (protected)
- `PUT /api/users/:id` (protected)
- `POST /api/users/:id/addresses` (protected)
- `PATCH /api/users/:id/addresses/:addressId` (protected)
- `DELETE /api/users/:id/addresses/:addressId` (protected)
- `POST /api/users/cart` (protected)
- `DELETE /api/users/cart/:productId` (protected)
- `DELETE /api/users/cart` (protected)

### Analytics (7)
- `GET /api/analytics/products/stats` (admin)
- `GET /api/analytics/products/top-rated`
- `GET /api/analytics/sales` (admin)
- `GET /api/analytics/sales/timeseries` (admin)
- `GET /api/analytics/orders/status` (admin)
- `GET /api/analytics/users/:userId/orders` (protected)
- `GET /api/analytics/reviews/stats`

**Total:** 36 endpoints

---

## Database Model Overview

### Embedded Documents
- Users: `addresses`, `cart`
- Products: `compatible_models`, `images`
- Orders: `items` (snapshot + quantity), `shipping_address`

### Referenced Documents
- Orders → Users
- Reviews → Users + Products
- Cart → Products

---

## Aggregations (Examples)
- Product statistics by category
- Top-rated products
- Sales analytics with `$lookup` + `$unwind`
- Order status distribution
- User order history
- Review rating distribution

---

## Indexes (Summary)
- Products: `{ category, price }`, `{ rating.average, sold_count }`
- Orders: `{ user, created_at }`, `{ order_status }`, `{ created_at }`
- Users: `{ email, is_active }`, `{ role, created_at }`
- Reviews: `{ product, rating }`, `{ user, product }`

---

## Frontend Pages
- `index.html`
- `products.html`
- `product.html`
- `cart.html`
- `dashboard.html`
- `login.html`
- `admin.html`

---

## Project Structure
```
online_cases_store/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── seed/
├── public/
│   ├── css/
│   └── js/
├── views/
│   ├── admin.html
│   ├── cart.html
│   ├── dashboard.html
│   ├── index.html
│   ├── login.html
│   ├── product.html
│   └── products.html
├── server.js
├── package.json
└── .env
```

---

## Setup
```bash
npm install
npm run seed
npm run dev
```

---

## Test Accounts
**Admin:** `admin@casesstore.com` / `admin1`

**Users:** `alex1@casesstore.com`, `sam2@casesstore.com`, `jamie3@casesstore.com`, `taylor4@casesstore.com`, `riley5@casesstore.com` / `1234`
