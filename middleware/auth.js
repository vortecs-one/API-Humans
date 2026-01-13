const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authenticateToken = (role) => {
    return (req, res, next) => {
        const authHeader = req.header('Authorization') || '';
        if (!authHeader) return res.status(401).json({ error: 'Access denied' });

        const parts = authHeader.split(' ');
        if (parts.length !== 2) return res.status(401).json({ error: 'Invalid Authorization format' });

        const token = parts[1];
        const secret = role === 'admin' ? process.env.JWT_SECRET_ADMIN : process.env.JWT_SECRET_DEV;

        jwt.verify(token, secret, (err, user) => {
            if (err) return res.status(403).json({ error: 'Invalid token' });
            req.user = user;
            next();
        });
    };
};

module.exports = { authenticateToken };

