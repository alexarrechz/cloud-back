const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const { getUser, getUsersByID, getAllUsers, addUser, subscribe, subscribed, stripeAccountLink, stripeAccount, stripeProducts, checkout, updateUser } = require('../controllers/userController');

router.post('/', addUser);
router.patch('/', verifyToken, updateUser);
router.get('/all', getAllUsers);
router.get('/subscribed', verifyToken, subscribed);

router.post('/subscribe', verifyToken, subscribe);

router.get('/:id', getUsersByID);
router.get('/', verifyToken, getUser);

router.post('/account', verifyToken, stripeAccount);
router.post('/account/link', verifyToken, stripeAccountLink);

router.get('/account/products', verifyToken, stripeProducts)
router.post('/checkout', verifyToken, checkout)


module.exports = router;