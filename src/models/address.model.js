const mongoose = require("mongoose");



const addressSchema = mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiver: {
            firstName: {
                type: String,
                required: true,
                trim: true
            },
            lastName: {
                type: String,
                required: true,
                trim: true
            },
            mobile: {
                type: Number,
                required: true,
                min: 1000000000,
            }
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        landmark: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        pinCode: {
            type: Number,
            required: true,
            min: 100000,
            max: 999999
        },
        state: {
            type: String,
            required: true,
            trim: true
        }
    }, { timestamps: true }
)

module.exports.Address = mongoose.model("Address", addressSchema);