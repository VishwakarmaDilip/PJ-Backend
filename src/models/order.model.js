const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            unique: true,
            required: true
        },
        products: {
            type: Array,
            required: true
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address"
        },
        tempAddress: {
            firstName: {
                type: String,
                trim: true
            },
            lastName: {
                type: String,
                trim: true
            },
            mobile: {
                type: Number,
                min: 1000000000,
            },
            address: {
                type: String,
                trim: true
            },
            landmark: {
                type: String,
                trim: true
            },
            city: {
                type: String,
                trim: true
            },
            pinCode: {
                type: Number,
                min: 100000,
                max: 999999
            },
            state: {
                type: String,
                trim: true
            }
        },
        discountAmount: {
            type: Number
        },
        grossAmount: {
            type: Number
        },
        shippingAmount: {
            type: Number
        },
        netAmount: {
            type: Number
        },
        status: {
            type: String,
            enum: ["Placed", "Shipping", "Delivered", "Cancelled"],
            default: "Placed"
        },
        delivery: {
           type: String 
        },
        trackingId: {
            type: String
        },
        paymentStatus: {
            type: String,
            enum: ["paid", "unpaid"]
        },
        paymentType: {
            type: String,
            enum: ["netBanking", "UPI", "POD"]
        },
        paymentTransactionId: {
            type: String
        }
    }, { timestamps: true }
)


exports.Order = mongoose.model("Order", orderSchema)