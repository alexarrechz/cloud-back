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

const updateUser = async (req, res) => {
    console.log(req.body);
    const { companyName, phone, description, picture } = req.body;
    const user = await User.findOneAndUpdate({ _id: req.user._id.toString() }, { companyName, phone, description, picture }, { new: true });
    res.json(user);
}

const subscribe = async (req, res) => {
    console.log("Usuario", req.user);
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
        });

        console.log(session);

        // Update user subscription status
        const user = await User.findOneAndUpdate({ _id: req.user._id.toString() }, { subscribed: true }, { new: true });
        console.log(user);
        res.json({ session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const subscribed = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id.toString() });
        res.json({ subscribed: user.subscribed });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const stripeAccount = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id.toString() });

        if (user.stripeAccount) {
            return res.json({
                account: user.stripeAccount,
                linked: true,
            });
        }

        const account = await stripe.accounts.create({});
        console.log(account);
        
        await User.findOneAndUpdate({ _id: req.user._id.toString() }, { stripeAccount: account.id });

        res.json({
            account: account.id,
            linked: false,
        });
    } catch (error) {
        console.error(
            "An error occurred when calling the Stripe API to create an account",
            error
        );
        res.status(500);
        res.send({ error: error.message });
    }
}

const stripeAccountLink = async (req, res) => {
    try {

        const user = await User.findOne({ _id: req.user._id.toString() });
        console.log("link",user);

        if (!user.stripeAccount) {
            return res.status(400).json({ error: "User does not have a Stripe account" });
        }

        const accountLink = await stripe.accountLinks.create({
            account: user.stripeAccount,
            return_url: `${req.headers.origin}/return/${user.stripeAccount}`,
            refresh_url: `${req.headers.origin}/refresh/${user.stripeAccount}`,
            type: "account_onboarding",
        });

        res.json(accountLink);
    } catch (error) {
        console.error(
            "An error occurred when calling the Stripe API to create an account link:",
            error
        );
        res.status(500);
        res.send({ error: error.message });
    }
}

const stripeProducts = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id.toString() });

        const stripe_account = await stripe.accounts.retrieve(user.stripeAccount);

        const products = await stripe.products.list({
            stripeAccount: stripe_account.id,
        });

        for(let i = 0; i < products.data.length; i++){
            const prices = await stripe.prices.list(products.data[i].defaul_price,{
                stripeAccount: stripe_account.id,
            });
            products.data[i].prices = prices.data[0];
        }

        console.log(products);
        res.json(products);
    } catch (error) {
        console.error(
            "An error occurred when calling the Stripe API to list products:",
            error
        );
        res.status(500);
        res.send({ error: error.message });
    }
}

const checkout = async (req, res) => {
    const { priceId } = req.body;
    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.REDIRECT_URI}/mas/success`,
            cancel_url: `${process.env.REDIRECT_URI}/mas/cancel`,
            
        }, { stripeAccount: req.user.stripeAccount });

        console.log(session);

        // Update user subscription status
        const user = await User.findOneAndUpdate({ _id: req.user._id.toString() }, { subscribed: true }, { new: true });
        console.log(user);
        res.json({ session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    addUser,
    updateUser,
    getAllUsers,
    getUsersByID,
    getUser,
    subscribe,
    subscribed,
    stripeAccount,
    stripeAccountLink,
    stripeProducts,
    checkout,
};