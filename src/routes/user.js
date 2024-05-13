const express = require('express');
const router = express.Router();
const User = require('../models/user');
const verifyToken = require('../middlewares/verifyToken');
const { getUser, getUsersByID, getAllUsers, addUser } = require('../controllers/userController');

router.post('/', addUser );

router.get('/all', getAllUsers );

router.get('/:id', getUsersByID );

router.get('/', verifyToken, getUser);
module.exports = router;