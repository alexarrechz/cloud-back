const User = require('../models/user');

const verifyToken = async (req, res, next) => {
    console.log(req.headers);
    const token = req.headers['authorization'];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            Authorization: `${token}`,
        },
    });
    const googleUser = await userResponse.json();

    const user = await User.findOne({ email: googleUser.email });

    if (!user) {
        const newUser = new User({ companyName: googleUser.name, phone: googleUser?.phone, email: googleUser.email, schedule: [], picture: googleUser.picture });
        await newUser.save();
        res.status(201).json(newUser);
    }
    else {
        req.user = user;
        next();
    } 
}

module.exports = verifyToken;