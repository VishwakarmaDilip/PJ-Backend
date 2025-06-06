const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
    {
        productId: {
            type:String,
            required:true,
            unique:true
        },
        productName: {
            type: String,
            requred: true
        },
        description: {
            type: String
        },
        image: [
            {
                type: String,
                required: true
            }
        ],
        price: {
            type: Number,
            require:true
        },
        quantity: {
            type: Number,
            require:true
        },
        category: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Category"
        }
    }, { timestamps: true }
)


exports.Product = mongoose.model("Product", productSchema)