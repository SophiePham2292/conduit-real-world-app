const express = require("express")
const mongoose = require("mongoose")

const userRouter = require("./routes/users")
const profileRouter = require("./routes/profiles")
const articleRouter = require("./routes/articles")
const tagRouter = require("./routes/tags")

const checkUser = require("./middleware/checkUser")

mongoose.connect("mongodb://localhost/conduit", { useNewUrlParser: true })
    .then(() => console.log("Connect to conduit db"))
    .catch(err => console.log(err))

const app = express();

app.use(express.json())
app.use(checkUser)

app.use("/api", userRouter)
app.use("/api/profiles", profileRouter)
app.use("/api/articles", articleRouter)
app.use("/api/tags", tagRouter)

app.listen(4000, () => console.log("Conduit server runnng on port 4000"))