require('dotenv').config();
const User = require('../models/user');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const plan = 'price_1PJmgDCTfeGF4JbWnLe5aEyU';

const addUser = async (req, res) => {
    const { companyName, phone, email, schedule, picture } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
    }

    const newUser = new User({ companyName, phone, email, schedule, picture });
    await newUser.save();
    res.status(201).json(newUser);
}

const getAllUsers = async (req, res) => {
    const users = await User.find();
    res.json(users);
}

const getUsersByID = async (req, res) => {
    if (!req.params.id) return res.status(400).json({ message: 'No id provided' });
    const user = await User.findOne({ _id: req.params.id });
    console.log(user);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
}

const getUser = async (req, res) => {
    res.json(req.user);
}

const subscribe = async (req, res) => {
    const { customerId } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.REDIRECT_URI}/mas/success`,
            cancel_url: `${process.env.REDIRECT_URI}/mas/cancel`,
            customer: customerId,
        });

        console.log(session);

        res.json({ session });
    } catch (error) {
        res.status(500).json({ error: error.message });

    }

}

module.exports = {
    addUser,
    getAllUsers,
    getUsersByID,
    getUser,
    subscribe,
};