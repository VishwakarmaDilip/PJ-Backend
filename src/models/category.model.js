const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
    {
        name: {
            type:String,
            required: true
        }
    },{timestamps:true}
)


exports.Category = mongoose.model("Category", categorySchema)