const express = require("express")
const { User } = require("../models/user")
const auth = require("../middleware/auth")

const router = express.Router()

router.get("/:username", async (req, res) => {
    const userFound = await User.findOne({ username: req.params.username })
    if (!userFound) return res.status(404).send("User not found")
    res.send(userFound)
})

router.post("/:username/follow", auth, async (req, res) => {
    const userFound = await User.findOne({ username: req.params.username }).select("id").lean()
    if (!userFound) return res.status(404).send("User not found")

    if (!req.user.following.some(id => JSON.stringify(id) === JSON.stringify(userFound._id))) req.user.following.push(userFound._id)
    const result = await req.user.save()
    res.send(result)
})

router.delete("/:username/follow", async (req, res) => {
    const userFound = await User.findOne({ username: req.params.username }).select("id").lean()
    if (!userFound) return res.status(404).send("User not found")

    if (req.user.following.some(id => id.equals(userFound._id))) {
        req.user.following = req.user.following.filter(id => !id.equals(userFound._id))
    }
    const result = await req.user.save()
    res.send(result)
})

module.exports = router;