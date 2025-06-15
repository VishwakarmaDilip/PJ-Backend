const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
    {
        orderId: Number,
        products:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product"
            }
        ],
        customer: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        totalAmount: {
            type:Number
        },
        discountAmount: {
            type:Number
        },
        grossAmount: {
            type:Number
        },
        shippingAmount: {
            type:Number
        },
        netAmount: {
            type:Number
        },
        status:{
            type:String,
            enum: [Placed, Shipping, Delivered, Cancelled],
            default:"Placed"
        },
        trackingId: {
            type:String
        },
        paymentStatus: {
            type: String,
            enum:[paid,unpaid]
        },
        paymentType: {
            type:String,
            enum:[netBanking,UPI,COD]
        },
        paymentTransactionId: {
            type: String
        }
    },{timestamps:true}
)


exports.Order = mongoose.model("Order", orderSchema)