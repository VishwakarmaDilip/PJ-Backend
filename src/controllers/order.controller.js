const { Order } = require("../models/order.model");
const { Product } = require("../models/product.model");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const asyncHandler = require("../utils/AsyncHandler");


const createOrder = asyncHandler(async (req, res) => {
    const { productIds, paymentType } = req.body;
    // const customer = req.user._id;
    // if (!products || !customer || !paymentType ) {
    //     throw new ApiError(406, "All fields are required");
    // }

    console.log("Products IDs:", productIds, "paymentType:", paymentType);

    const products = await Promise.all(productIds?.map(async (id) => {
        return await Product.findById(id).select("-__v -createdAt -updatedAt").populate("category", "categoryName");
    }))

    const totalAmount = products.reduce((total, product) => {
        if (!product || !product.price) {
            throw new ApiError(404, "Product not found or invalid price");
        }
        return total + product.price;
    }, 0);


    // console.log("Products:", products);
    console.log("Total Amount:", totalAmount);
    


    // const newOrder = await Order.create({
    //     products,
    //     customer,
    //     totalAmount,
    //     discountAmount,
    //     grossAmount,
    //     shippingAmount,
    //     netAmount,
    //     status,
    //     paymentStatus,
    //     paymentType,
    // });

    // if (!newOrder) {
    //     throw new ApiError(500, "Failed to create order");
    // }

    return res.status(201).json(new ApiResponse("Order created successfully", products));
})

module.exports = {
    createOrder
}