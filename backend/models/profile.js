const mongoose = require("mongoose")

const profileSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: ""
    },
    image: String,
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile"
    }]
})


const Profile = mongoose.model("Profile", profileSchema)

module.exports = Profile
