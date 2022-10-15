const jwt = require('jsonwebtoken');
const authMiddleware = (req, res, next) => {
    const token = req.header("x-auth");
    const secret = process.env.secret

    if (token) {
        const verify = jwt.verify(token, secret, (err, decode) => {
            if (err) {
                return res.json({error: err.message})
            }
            req.user = decode;
            next();
        });



    }
    else {
        return res.json({ error: "Unauthorized. No token found" })
    }
}

module.exports = authMiddleware