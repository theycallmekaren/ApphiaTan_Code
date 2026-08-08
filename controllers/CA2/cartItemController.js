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
            return res.status(500).json({
                success: false,
                message: error.message
            });
        });
};

module.exports.update = function (req, res){
    const cartItemId = req.body.cart_item_id;
    const quantity = req.body.quantity;

    return cartModel.updateCartItem(cartItemId, quantity)
    .then(function (updatedCartItem) {
        return res.status(200).json({
            success: true,
            message: 'Updated successfully.',
            data: updatedCartItem
        });
    })
    .catch(function (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    });
}

module.exports.retrieveCartItem = function (req, res) {
    return cartModel
        .getCartItem()
        .then(function (getCartItem) {
            return res.status(201).json({
                success: true,
                message: 'Cart retrieved successfully.',
                data: getCartItem
            })
        })
        .catch(function (error) {
            return res.status(500).json({ success: false, error: error.message });
        });
}

