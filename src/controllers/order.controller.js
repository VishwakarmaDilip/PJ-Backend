const { Cart } = require("../models/cart.model");
const { Order } = require("../models/order.model");
const { Product } = require("../models/product.model");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const asyncHandler = require("../utils/AsyncHandler");
const { shippingCharge } = require("../constants");
const { Counter } = require("../models/counter.model");
const { User } = require("../models/user.model");
const { default: mongoose } = require("mongoose");

// for user
const createOrder = asyncHandler(async (req, res) => {
    const { deliveryData, cartId, paymentType, delivery } = req.body
    const user = req.user

    if (!deliveryData, !cartId, !paymentType, !delivery) {
        throw new ApiError(400, "all feild required")
    }
    if (!user) {
        throw new ApiError(401, "Unauthorised user")
    }

    const cart = await Cart.findById(cartId)

    if (!cart) {
        throw new ApiError(404, "Cart Not found")
    }

    const products = cart.products
    const grossAmount = cart.cartValue
    const shippingAmount = shippingCharge
    const netAmount = grossAmount + shippingAmount
    const address = deliveryData._id
    const paymentStatus = paymentType === "POD" ? "unpaid" : "paid"

    const counter = await Counter.findOneAndUpdate(
        { id: "order" },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
    )

    const orderId = String(counter.sequence).padStart(6, "0")

    const order = await Order.create(
        {
            orderId,
            products,
            customer: user._id,
            grossAmount,
            shippingAmount,
            netAmount,
            delivery,
            paymentStatus,
            paymentType
        }
    )

    if (!order) {
        throw new ApiError(500, "Unable to create order")
    }

    if (address) {
        order.address = address
    } else {
        order.tempAddress = deliveryData
    }

    await order.save({ validateBeforeSave: false })

    const consumer = await User.findById(user._id)
    if (!consumer) {
        throw new ApiError(404, "user not found")
    }


    products.forEach(async (item) => {
        const product = await Product?.findById(item.product)
        const updatedQuantity = product?.quantity - item?.quantity

        product.quantity = updatedQuantity
        await product.save({validateBeforeSave:false})
    })


    cart.products = []
    cart.cartValue = 0
    consumer.orders.push(order._id)
    await cart.save({ validateBeforeSave: false })
    await consumer.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, order, "Order Created Successfully")
        )
})

const fetchAllordersUser = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "descending", startDate, endDate, orderStatus } = req.query
    const user = req.user_id


    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const skip = (pageNumber - 1) * limitNumber

    const sortOrder = sortType === "ascending" ? 1 : -1
    const matchObject = {}

    if (user) {
        matchObject["customer._id"] = new mongoose.Types.ObjectId(user)
    }

    if (startDate || endDate) {
        matchObject.createdAt = {}
        if (startDate) {
            matchObject.createdAt.$gte = new Date(startDate)
        }
        if (endDate) {
            matchObject.createdAt.$lte = new Date(endDate)
        }
    }

    if (orderStatus != "") {
        matchObject.status = orderStatus
    }

    const fetchedOrders = await Order.aggregate([
        {
            $lookup: {
                from: "products",
                let: {
                    productIds: {
                        $map: {
                            input: { $ifNull: ["$products", []] },
                            as: "p",
                            in: "$$p.product"
                        }
                    }
                },
                pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$productIds"] } } },
                    {
                        $project: {
                            description: 0,
                            discount: 0,
                            quantity: 0,
                            createdAt: 0,
                            updatedAt: 0,
                            __v: 0
                        }
                    }
                ],
                as: "productDocs"
            }
        },
        {
            $addFields: {
                products: {
                    $map: {
                        input: { $ifNull: ["$products", []] },
                        as: "item",
                        in: {
                            $mergeObjects: [
                                "$$item",
                                {
                                    product: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$productDocs",
                                                    as: "pd",
                                                    cond: { $eq: ["$$pd._id", "$$item.product"] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "customer",
                foreignField: "_id",
                as: "customer",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            fullName: 1,
                            email: 1,
                            mobile: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$customer",
                preserveNullAndEmptyArrays: true
            }
        },
        { $match: matchObject },
        { $sort: { [sortBy]: sortOrder } },
        { $skip: skip },
        { $limit: limitNumber },
        { $project: { updatedAt: 0, __v: 0, productDocs: 0 } }
    ])

    const countResult = await Order.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "customer",
                foreignField: "_id",
                as: "customer"
            }
        },
        {
            $unwind: {
                path: "$customer",
                preserveNullAndEmptyArrays: true
            }
        },
        { $match: matchObject },
        { $count: "totalOrders" }
    ])

    const totalOrders = countResult[0]?.totalOrders || 0

    const pageInfo = {
        page: pageNumber,
        limit: limitNumber,
        totalOrders,
        toatalPages: Math.ceil(totalOrders / limitNumber)
    }





    return res.status(200).json(
        new ApiResponse(
            200,
            {
                pageInfo,
                fetchedOrders
            }
        )
    )

})



// for owner
const getAllOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "descending" } = req.query
    const user = req.owner

    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const skip = (pageNumber - 1) * limitNumber

    const sortOrder = sortType === "ascending" ? 1 : -1
    const queryObject = {}

    if (query) {
        queryObject.$or = [
            { orderId: { $regex: query, $options: "i" } },
            { "customer.fullName": { $regex: query, $options: "i" } },
            { "customer.firstName": { $regex: query, $options: "i" } },
            { "customer.lastName": { $regex: query, $options: "i" } },
            { "customer.mobile": { $regex: query, $options: "i" } },
        ]
    }

    if (mongoose.Types.ObjectId.isValid(query)) {
        queryObject.$or.push({ "customer._id": new mongoose.Types.ObjectId(query) });
    }

    const fetchedOrders = await Order.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "customer",
                foreignField: "_id",
                as: "customer",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            fullName: 1,
                            email: 1,
                            mobile: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$customer",
                preserveNullAndEmptyArrays: true
            }
        },
        { $match: queryObject },
        { $sort: { [sortBy]: sortOrder } },
        { $skip: skip },
        { $limit: limitNumber },
        { $project: { updatedAt: 0, __v: 0 } }
    ])

    const countResult = await Order.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "customer",
                foreignField: "_id",
                as: "customer"
            }
        },
        {
            $unwind: {
                path: "$customer",
                preserveNullAndEmptyArrays: true
            }
        },
        { $match: queryObject },
        { $count: "totalOrders" }
    ])

    const totalOrders = countResult[0]?.totalOrders || 0

    const pageInfo = {
        page: pageNumber,
        limit: limitNumber,
        totalOrders,
        toatalPages: Math.ceil(totalOrders / limitNumber)
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                pageInfo,
                fetchedOrders
            }
        )
    )
})

const getRevenueAndOrders = asyncHandler(async (req, res) => {
    const timezone = "Asia/Kolkata"

    const result = await Order.aggregate([
        {
            $facet: {
                today: [
                    {
                        $match: {
                            status: { $ne: "Cancelled" },
                            $expr: {
                                $and: [
                                    {
                                        $gte: [
                                            "$createdAt",
                                            { $dateTrunc: { date: "$$NOW", unit: "day", timezone } }
                                        ]
                                    },
                                    {
                                        $lt: [
                                            "$createdAt",
                                            {
                                                $dateAdd: {
                                                    startDate: { $dateTrunc: { date: "$$NOW", unit: "day", timezone } },
                                                    unit: "day",
                                                    amount: 1
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    { $group: { _id: null, revenue: { $sum: "$netAmount" }, orders: { $sum: 1 } } }
                ],


                yesterday: [
                    {
                        $match: {
                            status: { $ne: "Cancelled" },
                            $expr: {
                                $and: [
                                    {
                                        $gte: [
                                            "$createdAt",
                                            {
                                                $dateAdd: {
                                                    startDate: { $dateTrunc: { date: "$$NOW", unit: "day", timezone } },
                                                    unit: "day",
                                                    amount: -1
                                                }
                                            }

                                        ]
                                    },
                                    {
                                        $lt: [
                                            "$createdAt",
                                            { $dateTrunc: { date: "$$NOW", unit: "day", timezone } }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    { $group: { _id: null, revenue: { $sum: "$netAmount" }, orders: { $sum: 1 } } }
                ],

                thisMonth: [
                    {
                        $match: {
                            status: { $ne: "Cancelled" },
                            $expr: {
                                $and: [
                                    {
                                        $gte: [
                                            "$createdAt",
                                            { $dateTrunc: { date: "$$NOW", unit: "month", timezone } }
                                        ]
                                    },
                                    {
                                        $lt: [
                                            "$createdAt",
                                            {
                                                $dateAdd: {
                                                    startDate: { $dateTrunc: { date: "$$NOW", unit: "month", timezone } },
                                                    unit: "month",
                                                    amount: 1
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    { $group: { _id: null, revenue: { $sum: "$netAmount" }, orders: { $sum: 1 } } }
                ],

                lastMonth: [
                    {
                        $match: {
                            status: { $ne: "Cancelled" },
                            $expr: {
                                $and: [
                                    {
                                        $gte: [
                                            "$createdAt",
                                            {
                                                $dateAdd: {
                                                    startDate: { $dateTrunc: { date: "$$NOW", unit: "month", timezone } },
                                                    unit: "month",
                                                    amount: -1
                                                }
                                            }

                                        ]
                                    },
                                    {
                                        $lt: [
                                            "$createdAt",
                                            { $dateTrunc: { date: "$$NOW", unit: "month", timezone } }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    { $group: { _id: null, revenue: { $sum: "$netAmount" }, orders: { $sum: 1 } } }
                ],
            }
        }
    ])

    const data = result[0]

    return res.status(200).json(
        new ApiResponse(200, {
            today: data.today[0] || { revenue: 0, orders: 0 },
            yesterday: data.yesterday[0] || { revenue: 0, orders: 0 },
            thisMonth: data.thisMonth[0] || { revenue: 0, orders: 0 },
            lastMonth: data.lastMonth[0] || { revenue: 0, orders: 0 }
        },
            "Revenue and Orders Count Fetched"
        )
    )
})




const getOrder = asyncHandler(async (req, res) => {
    const { order_id } = req.params

    if (!order_id) {
        throw new ApiError(400, "Order_Id is required")
    }


    const fetchedOrder = await Order.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(order_id)
            }
        },
        {
            $lookup: {
                from: "products",
                let: {
                    productIds: {
                        $map: {
                            input: { $ifNull: ["$products", []] },
                            as: "p",
                            in: "$$p.product"
                        }
                    }
                },
                pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$productIds"] } } },
                    {
                        $project: {
                            description: 0,
                            discount: 0,
                            quantity: 0,
                            createdAt: 0,
                            updatedAt: 0,
                            __v: 0
                        }
                    }
                ],
                as: "productDocs"
            }
        },
        {
            $addFields: {
                products: {
                    $map: {
                        input: { $ifNull: ["$products", []] },
                        as: "item",
                        in: {
                            $mergeObjects: [
                                "$$item",
                                {
                                    product: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$productDocs",
                                                    as: "pd",
                                                    cond: { $eq: ["$$pd._id", "$$item.product"] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "customer",
                foreignField: "_id",
                as: "customer",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            email: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "addresses",
                localField: "address",
                foreignField: "_id",
                as: "address",
                pipeline: [
                    {
                        $project: {
                            firstName: "$receiver.firstName",
                            lastName: "$receiver.lastName",
                            mobile: "$receiver.mobile",
                            _id: 1,
                            address: 1,
                            landmark: 1,
                            city: 1,
                            pinCode: 1,
                            state: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                address: {
                    $cond: {
                        if: { $eq: [{ $size: "$address" }, 0] },
                        then: ["$tempAddress"],
                        else: "$address"
                    }
                }
            }
        },
        {
            $project: {
                __v: 0,
                updatedAt: 0,
                productDocs: 0,
                tempAddress: 0
            }
        }
    ]);

    if (!fetchedOrder) {
        throw new ApiError(404, "No order found")
    }


    return res.status(200).json(
        new ApiResponse(
            200,
            fetchedOrder,
            "Order fetched Successfully"
        )
    )

})

const cancelOrder = asyncHandler(async (req, res) => {
    const { order_id } = req.params

    if (!order_id) {
        throw new ApiError(400, "Order Id required")
    }

    const order = await Order.findById(order_id)

    if (!order) {
        throw new ApiError(404, "Order Not Fount with this Id")
    }

    const orderTime = order.createdAt.getTime()

    // order.createdAt.toLocaleDateString

    const timeFromOrder = Date.now() - orderTime

    const allowdCancel = timeFromOrder <= 1800000

    if (req.owner || allowdCancel) {
        order.status = "Cancelled"

        await order.save({ validateBeforeSave: false })

    } else {
        throw new ApiError(401, "cancellation not allowd")
    }


    return res.status(200).json(
        new ApiResponse(
            200, order.status, "Order cancelled"
        )
    )

})


module.exports = {
    getOrder,
    cancelOrder,


    // for user
    createOrder,
    fetchAllordersUser,


    // for owner
    getAllOrders,
    getRevenueAndOrders
}