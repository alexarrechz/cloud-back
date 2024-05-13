require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);

const getToken = async (req, res) => {
    const { code } = req.query;

    const r = await client.getToken(code);
    const tokens = r.tokens;

    res.json(tokens);
}

const refresh = async (req, res) => {
    const refreshToken = req.headers['authorization'].split(' ')[1];

    if (!refreshToken) {
        return res.status(400).json({ message: 'No refresh token provided' });
    }

    try {
        const r = await client.refreshToken(refreshToken);
        const tokens = r.tokens;

        res.json(tokens);
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
}

module.exports = {
    getToken,
    refresh,
};