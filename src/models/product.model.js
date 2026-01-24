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
        discount: {
            type: Number,
            default: 0
        },
        quantity: {
            type: Number,
            require:true
        },
        category: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Category"
        },
        status: {
            type: String,
            enum: ["Enable", "Disable"],
            default: "Enable"
        }
    }, { timestamps: true }
)


exports.Product = mongoose.model("Product", productSchema)