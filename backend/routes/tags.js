const express = require("express")
const { Article } = require("../models/article")
const router = express.Router()

router.get("/", async (req, res) => {
    const allArticles = await Article.find().select("tagList").lean()
    let tagArray = []
    let resultArray = []
    allArticles.forEach(article => tagArray = tagArray.concat(article.tagList))
    tagArray.forEach(item => {
        if (!resultArray.includes(item)) resultArray.push(item)
    })
    res.send(resultArray)
})

module.exports = router