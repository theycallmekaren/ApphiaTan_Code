const express = require('express');
const router = express.Router();
const cartItemController = require('../../controllers/CA2/cartItemController');
const { ensureAuthenticated } = require('../../middleware/auth');

router.post('/createCartItem', ensureAuthenticated, cartItemController.create);

module.exports = router;
