const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const Joi = require("joi")
const jwt = require("jsonwebtoken")

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
})

userSchema.statics.hashPassword = async function (input) {
    const salt = await bcrypt.genSalt(10)
    const result = await bcrypt.hash(input, salt);
    console.log("inside hash password", result)
    return result
}


userSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id }, "jwtPrivateKey")
}

userSchema.methods.checkFollow = function (userId) {
    return this.following.some(id => id.equals(userId))
}


const User = mongoose.model("User", userSchema)

function validateUserInput(input = {}, type = "login") {
    let schema = {
        email: Joi.string().required(),
        password: Joi.string().required(),
        bio: Joi.string(),
        image: Joi.string(),
        following: Joi.array()
    }
    if (type === "registration") schema.username = Joi.string().required();
    return Joi.validate(input, schema)
}


module.exports = {
    User,
    validateUserInput
}
