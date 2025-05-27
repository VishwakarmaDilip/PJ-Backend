const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
    {
        categoryName: {
            type:String,
            required: true
        }
    },{timestamps:true}
)


exports.Category = mongoose.model("Category", categorySchema)