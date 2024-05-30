const express = require('express');
const { addFaq, getFaqs } = require('../controllers/faqController');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.get('/:id', getFaqs);
router.post('/', verifyToken, addFaq);


module.exports = router;