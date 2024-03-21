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

router.get('/all', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

router.get('/', async (req, res) => {
    const token = req.headers['authorization'];
    console.log(token);
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            Authorization: `${token}`,
        },
    });
    const googleUser = await userResponse.json();

    const user = await User.findOne({ email: googleUser.email });

    if (!user) {                
        const newUser = new User({ companyName: googleUser.name, phone: googleUser?.phone, email: googleUser.email, schedule: [], picture: googleUser.picture});
        await newUser.save();
        res.status(201).json(newUser);
    }
    else res.json(user);
});
module.exports = router;