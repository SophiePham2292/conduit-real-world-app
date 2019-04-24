const express = require("express")
const { Article, validateArticle } = require("../models/article")
const Comment = require("../models/comment")
const auth = require("../middleware/auth")
const { User } = require("../models/user")
const slugify = require("slugify")
const _ = require("lodash")
const router = express.Router()


router.post("/", auth, async (req, res) => {
    // 1. Validate input
    const { error } = validateArticle(req.body);
    if (error) return res.status(400).send(error.details[0].message)

    // 2. Get author profile & Create new article

    const newArticle = new Article({
        slug: slugify(req.body.title) + '-' + Math.random().toString(36).substr(2, 5),
        updatedAt: Date.now(),
        ...req.body,
        author: req.user._id
    })
    await newArticle.save()

    // 3. Transform db article to send to client

    let result = {
        ...newArticle._doc,
        author: {
            username: req.user.username,
            bio: req.user.bio,
            image: req.user.image,
            following: false
        }
    }

    res.send(result)
})

router.put("/:slug", auth, async (req, res) => {
    let article = await Article.findOne({ slug: req.params.slug }).select("-author")
    if (!article) return res.status(404).send("Article not found")

    for (let articleProp in req.body) {
        if (articleProp === "title") {
            article.slug = slugify(req.body[articleProp]) + '-' + Math.random().toString(36).substr(2, 5)
        }
        article[articleProp] = req.body[articleProp]
    }

    await article.save()
    let result = {
        ...article._doc,
        author: {
            username: req.user.username,
            bio: req.user.bio,
            image: req.user.image,
            following: false
        }
    }
    res.send(result)
})

router.delete("/:slug", async (req, res) => {
    const result = await Article.findOneAndDelete({ slug: req.params.slug, author: req.user._id })
    if (!result) return res.status(404).send("Article not found")
    res.send(result)
})

router.get("/", async (req, res) => {
    const { tag, author, favorited, limit, offset } = req.query;
    console.log(req.query);

    let queryObject = {}

    if (author) {
        const authorFound = await User.findOne({ username: author })
        if (!authorFound) return res.status(404).send("Articles not found!")
        queryObject.author = authorFound._id;
        console.log(authorFound)
    }


    if (favorited) {
        const userFound = await User.findOne({ username: favorited })
        if (!userFound) return res.status(404).send("Articles not found!")
        queryObject.favorited = userFound._id
    }


    if (tag) queryObject.tagList = tag;

    let articlesFound = await Article.find(queryObject).populate("author", "-email -password -__v").limit(limit || 20).skip(offset || 0).lean();
    if (articlesFound.length === 0) return res.status(404).send("No article found!")
    let isFollowing = false
    let isFavorited = false

    articlesFound.forEach(item => {
        if (req.user) {
            isFollowing = req.user.following.some(id => id.equals(item.author._id))
            isFavorited = item.favorited.some(id => id.equals(req.user._id))
        }
        item.author.following = isFollowing
        item.favorited = isFavorited
    })

    res.send({
        "articles": articlesFound,
        "articleCounts": articlesFound.length
    })
})

router.get("/feed", auth, async (req, res) => {
    // 1. get author me following
    const followingIds = req.user.following
    console.log(followingIds)

    // 2. get articles from these author
    let articlesFound = await Article.find({ author: { $in: followingIds } }).populate("author").lean()
    console.log(articlesFound)

    // 3. transform articles and send back
    let isFavorited = false
    articlesFound.forEach(item => {
        isFavorited = item.favorited.some(id => id.equals(req.user._id))
        item.author.following = true
        item.favorited = isFavorited
    })

    res.send({
        "articles": articlesFound,
        "articleCounts": articlesFound.length
    })
})

router.get("/:slug", async (req, res) => {
    const articleFound = await Article.findOne({ slug: req.params.slug }).populate("author", "-password -email").lean()
    if (!articleFound) return res.status(404).send("Article not found")

    let isFollowing = false
    let isFavorited = false
    if (req.user) {
        isFollowing = req.user.following.some(id => id.equals(articleFound.author._id))
        isFavorited = articleFound.favorited.some(id => id.equals(req.user._id))
    }
    articleFound.author.following = isFollowing
    articleFound.favorited = isFavorited

    res.send(articleFound)
})

/**
 * Favorite article
 */

router.post("/:slug/favorite", auth, async (req, res) => {
    const article = await Article.getArticleBySlug(req.params.slug)
    article.favorited.push(req.user._id.toString())
    const articleResult = await article.save()

    const articleJson = {
        ...articleResult._doc,
        favorited: true,
        author: {
            ...articleResult.author._doc,
            following: req.user.checkFollow(article.author._id)
        }
    }
    res.send(articleJson)
})

router.delete("/:slug/favorite", auth, async (req, res) => {
    const article = await Article.getArticleBySlug(req.params.slug)
    article.favorited = article.favorited.filter(id => id !== req.user._id.toString())
    const articleResult = await article.save()

    const articleJson = {
        ...articleResult._doc,
        favorited: false,
        author: {
            ...articleResult.author._doc,
            following: req.user.checkFollow(article.author._id)
        }
    }
    res.send(articleJson)
})

/**
 * Manage article comments
 */

router.post("/:slug/comments", auth, async (req, res) => {
    if (!req.body.body) return res.status(400).send("Comment content is required")

    const article = await Article.getArticleBySlug(req.params.slug)
    if (!article) return res.status(404).send("Article not found")

    const comment = new Comment({
        body: req.body.body,
        author: req.user._id,
        articleSlug: article.slug
    })

    const saveResult = await comment.save()
    res.send({
        ...saveResult._doc,
        author: {
            ..._.pick(req.user, ["username", "bio", "image"]),
            following: false
        }
    })
})

router.get("/:slug/comments", async (req, res) => {
    const comments = await Comment.find({ articleSlug: req.params.slug }).populate("author", "username bio image following").lean()
    comments.forEach(comment => {
        let isFollowing = false;
        if (req.user) {
            isFollowing = req.user.checkFollow(comment.author._id)
        }
        comment.author.following = isFollowing
    })
    res.send(comments)
})

router.delete("/:slug/comments/:id", auth, async (req, res) => {
    const result = await Comment.findOneAndDelete({ _id: req.params.id, author: req.user._id })
    if (!result) return res.send("Comment not found")
    res.send(result)
})

module.exports = router