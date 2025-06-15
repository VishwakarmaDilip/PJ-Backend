const { Order } = require("../models/order.model");
const { ApiError } = require("../utils/ApiError");
const asyncHandler = require("../utils/AsyncHandler");


const createOrder = asyncHandler(async (req, res) => {
    const { products, customer, totalAmount, discountAmount, grossAmount, shippingAmount, netAmount, status, trackingId, paymentStatus, paymentType, paymentTransactionId } = req.body;

    if (!products || !customer || !totalAmount || !discountAmount || !grossAmount || !shippingAmount || !netAmount || !status || !trackingId || !paymentStatus || !paymentType || !paymentTransactionId) {
        throw new ApiError(406, "All fields are required");
    }

    const newOrder = await Order.create({
        products,
        customer,
        totalAmount,
        discountAmount,
        grossAmount,
        shippingAmount,
        netAmount,
        status,
        trackingId,
        paymentStatus,
        paymentType,
        paymentTransactionId
    });

    if (!newOrder) {
        throw new ApiError(500, "Failed to create order");
    }

    return res.status(201).json(new ApiResponse("Order created successfully", newOrder));
} )