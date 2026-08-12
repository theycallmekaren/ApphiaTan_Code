const express = require('express');
const router = express.Router();
const path = require('path');
const { ensureAuthenticated } = require('../../middleware/auth');
const checkoutController = require('../../controllers/CA2/checkoutController');

router.get('/summary', ensureAuthenticated, checkoutController.checkoutSummary  );




module.exports = router;
