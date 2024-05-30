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
    if (!req.user.admin) return res.status(403).json({ message: 'Unauthorized' });
    const users = await User.find();
    res.json(users);
}

const getUsersByID = async (req, res) => {
    if (!req.params.id) return res.status(400).json({ message: 'No id provided' });
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
}

const getUser = async (req, res) => {
    res.json(req.user);
}

const updateUser = async (req, res) => {
    const { companyName, phone, description, picture } = req.body;
    const user = await User.findOneAndUpdate({ _id: req.user._id.toString() }, { companyName, phone, description, picture }, { new: true });
    res.json(user);
}

const subscribe = async (req, res) => {
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
        // Update user subscription status
        const user = await User.findOneAndUpdate({ _id: req.user._id.toString() }, { subscribed: true }, { new: true });
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
    const { id } = req.params;
    try {
        const user = await User.findOne({ _id: id });
        if(!user.stripeAccount) return res.status(400).json({ message: 'No Stripe account linked' });

        const stripe_account = await stripe.accounts.retrieve(user.stripeAccount);

        const products = await stripe.products.list({
            stripeAccount: stripe_account.id,
        });

        for (let i = 0; i < products.data.length; i++) {
            const prices = await stripe.prices.list(products.data[i].defaul_price, {
                stripeAccount: stripe_account.id,
            });
            products.data[i].prices = prices.data[0];
            products.data[i].companyId = id;
        }

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
const stripeProduct = async (req, res) => {
    const { id, price } = req.params;
    try {
        const user = await User.findOne({ _id: id });

        const stripe_account = await stripe.accounts.retrieve(user.stripeAccount);

        const product = await stripe.products.retrieve(price, {
            stripeAccount: stripe_account.id,
        });

        const prices = await stripe.prices.list(product.defaul_price, {
            stripeAccount: stripe_account.id,
        });
        product.prices = prices.data[0];
        product.companyId = id;

        res.json(product);
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
    const { companyId, productId, priceId, successUrl, cancelUrl, quantity = 1 } = req.body;
    if(companyId === "undefined") return res.status(400).json({ message: 'No company ID provided' });
    try {

        const user = await User.findOne({ _id: companyId });
        const code = Math.random().toString(36).substring(7);

        const session = await stripe.checkout.sessions.create({
            mode: priceId == plan ? 'subscription' : 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity,
                },
            ],
            success_url: `${successUrl}?code=${code}&`,
            cancel_url: cancelUrl,
            client_reference_id: code,
            metadata: { code, product: productId, quantity },
        }, { stripeAccount: user.stripeAccount });


        if (priceId === plan) {
            const user = await User.findOneAndUpdate({ _id: req.user._id.toString() }, { subscribed: true }, { new: true });
        }
        res.json({ session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getPayouts = async (req, res) => {
    const payouts = await stripe.checkout.sessions.list({
        stripeAccount: req.user.stripeAccount,
    });
    const products = [];
    
    for (let i = 0; i < payouts.data.length; i++) {
        console.log(payouts.data[i].metadata);
        if(!payouts.data[i].metadata.code || !payouts.data[i].metadata.product || !payouts.data[i].metadata.quantity) continue;
        const product = await stripe.products.retrieve(payouts.data[i].metadata.product, {
            stripeAccount: req.user.stripeAccount,
        });
        product.quantity = payouts.data[i].metadata.quantity;
        product.code = payouts.data[i].metadata.code;
        products.push(product);
    }
    
    console.log(products);
    res.json(products);
}



const getSettings = (req, res) => {
    res.json(req.user.settings);
}

const updateSettings = async (req, res) => {
    const { settings } = req.body;
    const user = await User.findOneAndUpdate({ _id: req.user._id.toString() }, { settings }, { new: true });
    res.json(user.settings);
}

const toggleAdmin = async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const updatedUser = await User.findOneAndUpdate({ _id: req.params.id }, { admin: !user.admin }, { new: true });
    res.json(updatedUser);
}

module.exports = {
    addUser,
    updateUser,
    getAllUsers,
    getUsersByID,
    getPayouts,
    getUser,
    getSettings,
    toggleAdmin,
    updateSettings,
    subscribe,
    subscribed,
    stripeAccount,
    stripeAccountLink,
    stripeProducts,
    stripeProduct,
    checkout,
};