const dotenv = require('dotenv').config()
const connectDB = require("./db/db")
const app = require('./app')


connectDB()
    .then(() => {
        app.on("Error", (error)=> {
            console.log(("Error :", error));
            throw error
        })
        app.listen(process.env.PORT || 3000 , () => {
            console.log(`server is running on port : ${process.env.PORT}`);
            
        })
    })
    .catch((err) => {
        console.log("MONGO DB connection failled !!!" , err);
        
    })
