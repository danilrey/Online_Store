const User = require('../models/User');

//desc - get user profile
//route - get /api/users/:id
//access - private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    //users can only view their own profile unless admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this profile'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

//desc - update user profile
//route - put /api/users/:id
//access - private
exports.updateUserProfile = async (req, res) => {
  try {
    //users can only update their own profile
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    const { name, phone, addresses } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (addresses) updateData.addresses = addresses;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

//desc - add address to user
//route - post /api/users/:id/addresses
//access - private
exports.addAddress = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = req.body;
    if (address.is_default) {
      user.addresses.forEach(addr => {
        addr.is_default = false;
      });
    }

    user.addresses.push(address);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address added successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding address',
      error: error.message
    });
  }
};

//desc - update address
//route - patch /api/users/:id/addresses/:addressId
//access - private
exports.updateAddress = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const { street, city, country, phone, is_default } = req.body;
    if (street !== undefined) address.street = street;
    if (city !== undefined) address.city = city;
    if (country !== undefined) address.country = country;
    if (phone !== undefined) address.phone = phone;

    if (is_default === true) {
      user.addresses.forEach(addr => {
        addr.is_default = addr._id.toString() === req.params.addressId;
      });
    } else if (is_default === false) {
      address.is_default = false;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating address',
      error: error.message
    });
  }
};

//desc - remove address from user
//route - delete /api/users/:id/addresses/:addressId
//access - private
exports.removeAddress = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { addresses: { _id: req.params.addressId } } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Address removed successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error removing address',
      error: error.message
    });
  }
};

//desc - add product to cart
//route - post /api/users/cart
//access - private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    //check if product already in cart
    const user = await User.findById(req.user._id);
    const cartItemIndex = user.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (cartItemIndex > -1) {
      //update quantity using positional operator $
      await User.findOneAndUpdate(
        { _id: req.user._id, 'cart.product': productId },
        { $inc: { 'cart.$.quantity': quantity } },
        { new: true }
      );
    } else {
      //add new item to cart
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: {
            cart: {
              product: productId,
              quantity: quantity
            }
          }
        },
        { new: true }
      );
    }

    const updatedUser = await User.findById(req.user._id)
      .populate('cart.product')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      data: updatedUser.cart
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding to cart',
      error: error.message
    });
  }
};

//desc - remove product from cart
//route - delete /api/users/cart/:productId
//access - private
exports.removeFromCart = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { cart: { product: req.params.productId } } },
      { new: true }
    ).populate('cart.product').select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      data: user.cart
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error removing from cart',
      error: error.message
    });
  }
};

//desc - clear cart
//route - delete /api/users/cart
//access - private
exports.clearCart = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { cart: [] } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: user.cart
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};
