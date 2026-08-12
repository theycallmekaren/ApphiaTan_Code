const cartModel = require("../../prismaQueries/checkout");

module.exports.checkoutSummary = function (req, res){
    const memberId = req.user.user_id;

    return cartModel.calculateCheckout(memberId)
    .then(function (result){
        return res.status(201).json({
            success: true,
            message: "Checkout summary retrieved successfully.",
            data: result
        });
    })
    .catch(function (error){
        return res.status(500).json({success: false, error: error.message});
    });
};