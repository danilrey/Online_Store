const mongoose = require('mongoose');

//embedded order item schema
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  //snapshot of product details at time of order
  product_snapshot: {
    name: String,
    price: Number,
    image: String
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  //referenced user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  order_number: {
    type: String,
    unique: true,
    required: true
  },
  //embedded order items
  items: [orderItemSchema],
  //embedded shipping address
  shipping_address: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true }
  },
  payment_method: {
    type: String,
    required: true,
    enum: ['credit-card', 'paypal', 'kaspi-qr', 'cash-on-delivery']
  },
  order_status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  pricing: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  tracking_number: {
    type: String,
    trim: true
  },
  delivered_at: {
    type: Date
  },
  cancelled_at: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

//compound indexes
orderSchema.index({ user: 1, created_at: -1 });
orderSchema.index({ order_status: 1 });
orderSchema.index({ created_at: -1 });

//generate order number before saving
orderSchema.pre('validate', async function(next) {
  if (!this.order_number) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.order_number = `ORD${year}${month}${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
