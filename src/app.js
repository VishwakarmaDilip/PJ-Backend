const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')


const app = express()

const whiteList = process.env.CORS_ORIGIN_WHITELIST

app.use(cors({
    origin:function(origin,callback) {
        if(!origin || whiteList.includes(origin)) {
            callback(null, true)
        }else {
            callback(new Error("Note allowed by CORS"))
        }
    },
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// Imports Routes
const ownerRouter = require('./routes/owner.routes')
const productRouter = require('./routes/product.routes')
const userRouter = require('./routes/user.routes')
const orderRouter = require('./routes/order.routes')

// Routes Declaration
app.use("/api/v1/owner", ownerRouter)
app.use("/api/v1/product", productRouter )
app.use("/api/v1/user", userRouter)
app.use("/api/v1/order", orderRouter)



module.exports = app