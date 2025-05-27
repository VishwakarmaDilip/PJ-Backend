const { Category } = require("../models/category.model")
const { Counter } = require("../models/counter.model")
const { Product } = require("../models/product.model")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const asyncHandler = require("../utils/AsyncHandler")
const { uploadOnCloudinary } = require("../utils/Cloudinary")





const createProduct = asyncHandler(async (req, res) => {
    const { productName, description, price, quantity, category } = req.body
    const imageLocalPath = req?.file?.path


    if (!productName || !description || !price || !quantity || !category || !imageLocalPath) {
        throw new ApiError(406, "All fields Required")
    }
    const image = await uploadOnCloudinary(imageLocalPath, true)

    if (!image) {
        throw new ApiError(406, "Something went wrong while uploading the image")
    }

    let productCategory = await Category.findOne({ categoryName: category })
    

    if (!productCategory) {
        throw new ApiError(404, "Category Not found")
    }

    productCategory = productCategory._id

    const counter = await Counter.findOneAndUpdate(
        { id: "product" },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
    )

    const nextId = counter.sequence
    const formattedId = String(nextId).padStart(6, "0")

    const newProduct = await Product.create(
        {
            productId: formattedId,
            productName,
            description,
            image:image,
            price,
            quantity,
            category: productCategory
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200, newProduct, "Product Created Successfully"
        ))

})


const createCategory = asyncHandler(async (req, res) => {
    const {category} = req.body
    
    if (!category) {
        throw new ApiError(406, "category required..!")
    }
    const newCategory = await Category.create(
        {
            categoryName: category
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, newCategory, "category created")
        )
})


module.exports = {
    createProduct,
    createCategory
}