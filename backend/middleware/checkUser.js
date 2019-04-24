const jwt = require("jsonwebtoken")
const { User } = require("../models/user")

async function checkUser(req, res, next) {
    const token = req.header('x-auth-token')
    if (!token) return next()

    try {
        const decoded = jwt.verify(token, "jwtPrivateKey")
        const user = await User.findById(decoded._id)
        req.user = user
        next()
    } catch (ex) {
        console.log(ex)
        next(ex)
    }
}

module.exports = checkUser;