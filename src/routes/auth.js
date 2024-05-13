const express = require('express');
const { getToken, refresh } = require('../controllers/authController');

const auth = express.Router();

auth.get('/token', getToken);
auth.get('/refresh', refresh);

module.exports = auth;