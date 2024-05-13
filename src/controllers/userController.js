const User = require('../models/user');

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

module.exports = {
    addUser,
    getAllUsers,
    getUsersByID,
    getUser,
};