require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user');

const client = new OAuth2Client(process.env.CLIENT_ID);

const verifyToken = async (req, res, next) => {
    if (!req.headers['authorization']) return res.status(401).json({ message: 'No token provided' });
    const token = req.headers['authorization'].split(' ')[1];

    console.log(token);

    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,
        });

        const googleUser = ticket.getPayload();

        const user = await User.findOne({ email: googleUser.email });

        if (!user) {
            const newUser = new User({ companyName: googleUser.name, phone: googleUser?.phone, email: googleUser.email, schedule: [], picture: googleUser.picture });
            await newUser.save();
        }
        else {
            req.user = user;
            next();
        }
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }

}

module.exports = verifyToken;