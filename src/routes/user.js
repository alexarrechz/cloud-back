const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const { getUser, getUsersByID, getAllUsers, addUser, subscribe } = require('../controllers/userController');

router.post('/', addUser );

router.get('/all', getAllUsers );

router.get('/:id', getUsersByID );

router.get('/', verifyToken, getUser);

router.post('/subscribe', verifyToken, subscribe);
module.exports = router;