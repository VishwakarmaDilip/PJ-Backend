const mongoose = require("mongoose");



const addressSchema = mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        address: {
            type: String,
            required: true
        },
        area: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        pinCode: {
            type: Number,
            required: true
        },
        state: {
            type: String,
            required: true
        }
    },{ timestamps: true }
)

module.exports.Address = mongoose.model("Address", addressSchema);