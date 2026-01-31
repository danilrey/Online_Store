const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

//desc - get reviews for a product
//route - get /api/products/:productId/reviews
//access - public
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sort = '-createdAt', page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    const total = await Review.countDocuments({ product: productId });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

//desc - create a review
//route - post /api/reviews
//access - private
exports.createReview = async (req, res) => {
  try {
    const { product, rating, title, comment } = req.body;

    //check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    //allow reviews only for delivered orders
    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      order_status: 'delivered',
      'items.product': product
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: 'Only customers with delivered orders can leave a review'
      });
    }

    //check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: product
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    //create review
    const review = await Review.create({
      user: req.user._id,
      product,
      rating,
      title,
      comment
    });

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name')
      .populate('product', 'name');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: populatedReview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

//desc - update a review
//route - put /api/reviews/:id
//access - private
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    //check if the user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    //update with $set
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('user', 'name');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

//desc - mark review as helpful
//route - patch /api/reviews/:id/helpful
//access - private
exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    //check if user already marked this review as helpful
    if (review.helpful.users.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You already marked this review as helpful'
      });
    }

    //use $push to add user and $inc to increment count
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      {
        $push: { 'helpful.users': req.user._id },
        $inc: { 'helpful.count': 1 }
      },
      { new: true }
    ).populate('user', 'name');

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      data: updatedReview
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error marking review as helpful',
      error: error.message
    });
  }
};

//desc - delete a review
//route - delete /api/reviews/:id
//access - private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    //check if user owns the review or is admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};
