const transactionModel = require("../../models/transaction");
const checkoutModel = require("../../prismaQueries/checkout");

module.exports.placeOrder = function (req, res) {
  const memberId = req.user.user_id;

  return checkoutModel.calculateCheckout(memberId)
    .then(function (checkoutSummary) {
      return transactionModel.place_order(
        memberId,
        checkoutSummary.finalPrice
      );
    })
    .then(function (result) {
      if (!result.orderPlaced) {
        return res.status(200).json({
          success: true,
          message: "No available cart items were processed, so no order was created.",
          data: result
        });
      }

      return res.status(201).json({
        success: true,
        message: "Order placed successfully.",
        data: result
      });
    })
    .catch(function (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    });
};

