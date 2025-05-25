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



module.exports = app