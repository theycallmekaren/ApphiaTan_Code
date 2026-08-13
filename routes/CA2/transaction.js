const express = require('express');
const router = express.Router();
const path = require('path');
const { ensureAuthenticated } = require('../../middleware/auth');
const controller = require('../../controllers/CA2/transactionController');

router.post('/transfer', ensureAuthenticated, controller.placeOrder  );




module.exports = router;
