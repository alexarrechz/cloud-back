const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const { getUser, getUsersByID, getAllUsers, addUser, subscribe, subscribed, stripeAccountLink, stripeAccount, stripeProducts, stripeProduct, checkout, updateUser, getSettings, updateSettings, toggleAdmin, getPayouts } = require('../controllers/userController');

router.post('/', addUser);
router.patch('/', verifyToken, updateUser);
router.get('/all', verifyToken, getAllUsers);
router.patch('/admin/:id', verifyToken, toggleAdmin);
router.get('/settings', verifyToken, getSettings);
router.patch('/settings', verifyToken, updateSettings);
router.get('/subscribed', verifyToken, subscribed);

router.post('/subscribe', verifyToken, subscribe);

router.get('/:id', getUsersByID);
router.get('/', verifyToken, getUser);

router.post('/account', verifyToken, stripeAccount);
router.post('/account/link', verifyToken, stripeAccountLink);

router.get('/account/products/:id', stripeProducts)
router.get('/account/product/:id/:price', stripeProduct)
router.post('/checkout', checkout)
router.get('/account/payouts', verifyToken, getPayouts)


module.exports = router;