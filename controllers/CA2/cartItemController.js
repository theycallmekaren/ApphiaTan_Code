const cartModel = require('../../prismaQueries/cart');

module.exports.create = function (req, res) {
    const memberId = req.user.user_id;
    const productId = req.body.product_id;
    const quantity = req.body.quantity;

    return cartModel.createCartItem(memberId, productId, quantity)
        .then(function (cartItem) {
            return res.status(201).json({
                success: true,
                message: 'Added to cart successfully.',
                data: cartItem
            });
        })
        .catch(function (error) {
            return res.status(error.status || 500).json({
                success: false,
                message: error.message
            });
        });
};

module.exports.update = functio
