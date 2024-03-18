const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/', async (req, res) => {
    const { companyName, phone, email, schedule, picture } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
    }

    const newUser = new User({ companyName, phone, email, schedule, picture });
    await newUser.save();
    res.status(201).json(newUser);
});

router.get('/', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

module.exports = router;