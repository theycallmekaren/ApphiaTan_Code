const cartModel = require("../../prismaQueries/cart");

module.exports.create = function (req, res) {
  const memberId = req.user.user_id;
  const productId = Number(req.body.product_id);
  const quantity = Number(req.body.quantity);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Product ID must be a positive whole number.",
    });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be a positive whole number.",
    });
  }

  return cartModel
    .createCartItem(memberId, productId, quantity)
    .then(function (cartItem) {
      return res.status(201).json({
        success: true,
        message: "Added to cart successfully.",
        data: cartItem,
      });
    })
    .catch(function (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    });
};

module.exports.update = function (req, res) {
  const memberId = req.user.user_id;
  const cartItemId = Number(req.body.cart_item_id);
  const quantity = Number(req.body.quantity);

  if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Cart item ID must be a positive whole number.",
    });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be a positive whole number.",
    });
  }

  return cartModel
    .updateCartItem(memberId, cartItemId, quantity)
    .then(function (updatedCartItem) {
      return res.status(200).json({
        success: true,
        message: "Updated successfully.",
        data: updatedCartItem,
      });
    })
    .catch(function (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    });
};

module.exports.retrieveCartItem = function (req, res) {
  const memberId = req.user.user_id;

  return cartModel
    .getCartItem(memberId)
    .then(function (getCartItem) {
      return res.status(200).json({
        success: true,
        message: "Cart retrieved successfully.",
        data: getCartItem,
      });
    })
    .catch(function (error) {
      return res.status(500).json({ success: false, error: error.message });
    });
};

module.exports.delete = function (req, res) {
  const memberId = req.user.user_id;
  const cartItemId = Number(req.body.cart_item_id);

  if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Cart item ID must be a positive whole number.",
    });
  }

  return cartModel
    .deleteCartItem(memberId, cartItemId)
    .then(function () {
      return res
        .status(200)
        .json({ success: true, message: "Product removed successfully." });
    })
    .catch(function (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    });
};

module.exports.cartSummary = function (req, res) {
  const memberId = req.user.user_id;

  return cartModel
    .getCartSummary(memberId)
    .then(function (result) {
      return res.status(200).json({
        success: true,
        message: "Cart summary retrieved successfully.",
        data: result,
      });
    })
    .catch(function (error) {
      return res.status(500).json({ success: false, error: error.message });
    });
};
