const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  updateReview,
  markHelpful,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

//public route for getting reviews by product
router.get('/products/:productId', getProductReviews);

//protected routes
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.patch('/:id/helpful', protect, markHelpful);
router.delete('/:id', protect, deleteReview);

module.exports = router;
