const express = require('express');
const router = express.Router();
const cartItemController = require('../../controllers/CA2/cartItemController');
const { ensureAuthenticated } = require('../../middleware/auth');

router.post('/createCartItem', ensureAuthenticated, cartItemController.create);
router.put('/updateCartItem', ensureAuthenticated, cartItemController.update);
router.get('/retrieveCartItem', ensureAuthenticated, cartItemController.retrieveCartItem);
router.delete('/deleteCartItem', ensureAuthenticated, cartItemController.delete);


module.exports = router;
