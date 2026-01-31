const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

//desc - create new order
//route - post /api/orders
//access - private
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, pricing } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }

    if (!shippingAddress || !paymentMethod || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Missing order details'
      });
    }

    //validate and prepare order items with product snapshots
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const price = product.price;

      orderItems.push({
        product: product._id,
        product_snapshot: {
          name: product.name,
          price,
          image: product.images?.[0] || ''
        },
        quantity: item.quantity,
        price,
        subtotal: price * item.quantity
      });

      //decrease stock and increase sold count using $inc
      await Product.findByIdAndUpdate(product._id, {
        $inc: {
          stock: -item.quantity,
          sold_count: item.quantity
        }
      });
    }

    //create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      pricing
    });

    //populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

//desc - get user's orders
//route - get /api/orders
//access - private
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.order_status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('items.product', 'name images')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

//desc - get single order
//route - get /api/orders/:id
//access - private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images specifications');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    //check if the user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

//desc - get all orders (admin)
//route - get /api/orders/all
//access - private/admin
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.order_status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

//desc - update order status
//route - patch /api/orders/:id/status
//access - private/admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber, note } = req.body;

    const updateData = {};
    if (orderStatus) {
      updateData.order_status = orderStatus;
    }

    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }

    if (orderStatus === 'delivered') {
      updateData.delivered_at = new Date();
    }

    if (orderStatus === 'cancelled') {
      updateData.cancelled_at = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateData
      },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

//desc - cancel order
//route - delete /api/orders/:id
//access - private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    //check authorization
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    //can only cancel pending or processing orders
    if (!['pending', 'processing'].includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order in current status'
      });
    }

    //restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stock: item.quantity,
          sold_count: -item.quantity
        }
      });
    }

    //update order status
    order.order_status = 'cancelled';
    order.cancelled_at = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};
