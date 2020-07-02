require('dotenv').config();

const jwt = require('jsonwebtoken');

module.exports.requiredLogin = (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) 
        return res.json({ error: 'You must be logged in' });
    
    jwt.verify(authorization, process.env.JWT_KEY , function(err, payload) {
        if (err) {
            console.log(err);
            return res.json({ error: 'You must be logged in'});
        }
        // console.log('gooo');
        req.user = payload.user; 
        next();    
    });
}