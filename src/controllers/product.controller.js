const { Category } = require("../models/category.model")
const { Product } = require("../models/product.model")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const asyncHandler = require("../utils/AsyncHandler")
const { uploadOnCloudinary } = require("../utils/Cloudinary")





const addProduct = asyncHandler(async (req, res) => {
    const { name, description, price, quantity, category } = req.body
    const imageLocalPath = req?.file?.path

    if (!name || !description || !price || !quantity || !category || !imageLocalPath) {
        throw new ApiError(406, "All fields Required")
    }
    const image = await uploadOnCloudinary(imageLocalPath)

    if (!image) {
        throw new ApiError(406, "Something went wrong while uploading the image")
    }

    let productCategory = await Category.findOne({name:category})

    if(!productCategory) {
        throw new ApiError(404, "Category Not found")
    }

    productCategory = productCategory._id

    const product = await Product.create(
        {
            productName:name,
            description,
            image:image,
            price,
            quantity,
            category:productCategory
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200, product, "Product Created Successfully"
        ))

})


module.exports= {
    addProduct
}