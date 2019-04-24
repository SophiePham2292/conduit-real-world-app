const mongoose = require("mongoose")
const Joi = require("joi")

const articleSchema = new mongoose.Schema({
    slug: String,
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    tagList: [String],
    updatedAt: {
        type: Date,
        default: Date.now
    },
    favorited: [String],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

articleSchema.methods.checkFavorited = function (userId) {
    return this.favorited.includes(userId.toString())
}

articleSchema.statics.getArticleBySlug = async function (slug) {
    return Article.findOne({ "slug": slug }).populate("author", "-email -password")
}

const Article = mongoose.model("Article", articleSchema)

function validateArticle(input = {}) {
    const schema = {
        title: Joi.string().required(),
        description: Joi.string().required(),
        body: Joi.string().required(),
        tagList: Joi.array()
    }
    return Joi.validate(input, schema)
}

module.exports = {
    Article,
    validateArticle
}