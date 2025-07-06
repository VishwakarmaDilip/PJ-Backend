const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            },
            totalAmount: {
                type: Number,
                required: true
            },
        }
    ],
    cartValue: {
        type: Number,
        required: true,
    }
}, { timestamps: true });

module.exports.Cart = mongoose.model("Cart", cartSchema);