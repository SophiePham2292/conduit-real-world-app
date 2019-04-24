const express = require("express")
const { User, validateUserInput } = require("../models/user")
const Profile = require("../models/profile")
const _ = require("lodash")
const bcrypt = require("bcrypt")
const auth = require("../middleware/auth")

const router = express.Router()

router.post('/users/login', async (req, res) => {
    const { error } = await validateUserInput(req.body, "login");
    if (error) return res.status(400).send(error.details[0].message)

    const { email, password } = req.body

    const userWithEmail = await User.findOne({ email });
    if (!userWithEmail) return res.status(400).send("Invalid email or password")

    const comparePassword = await bcrypt.compare(password, userWithEmail.password);
    if (!comparePassword) return res.status(400).send("Invalid email or password")

    const token = userWithEmail.generateAuthToken();

    const userResponse = {
        email: email,
        token: token,
        username: userWithEmail.username,
        bio: userWithEmail.bio,
        image: userWithEmail.image
    }

    res.header('x-auth-token', token).send(userResponse)
})

router.post("/users", async (req, res) => {
    const { error } = validateUserInput(req.body, "registration");
    if (error) return res.status(400).send(error.details[0].message)

    const userWithEmail = await User.findOne({ email: req.body.email });
    if (userWithEmail) return res.status(400).send("Email has been used")

    const { email, password, username } = req.body
    let newUser = new User({
        email,
        password,
        username
    })
    newUser.password = await User.hashPassword(req.body.password);

    newUser = await newUser.save();

    res.send({
        email: newUser.email,
        password: req.body.password,
        username: newUser.username
    })
})

router.get("/user", auth, async (req, res) => {
    delete req.user._doc.password
    res.send(req.user._doc)
})

router.put("/user", auth, async (req, res) => {
    const acceptedInputArray = ["email", "username", "password", "image", "bio"];
    for (let userProp in req.body) {
        if (acceptedInputArray.some(input => input === userProp)) {
            if (userProp !== "password") {
                req.user[userProp] = req.body[userProp]
            } else {
                const hashPassword = await User.hashPassword(req.body.password)
                req.user.password = hashPassword
            }
        }
    }
    const saveResult = await req.user.save()
    saveResult.password = req.body.password
    res.send(saveResult)
})

module.exports = router;