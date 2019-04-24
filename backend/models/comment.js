const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema({
    body: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    articleSlug: String
})

const Comment = mongoose.model("Comment", commentSchema)

module.exports = Comment
