const { Category } = require("../models/category.model")
const { Counter } = require("../models/counter.model")
const { Product } = require("../models/product.model")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const asyncHandler = require("../utils/AsyncHandler")
const { uploadOnCloudinary, deleteFromCloudinary } = require("../utils/Cloudinary")





const createProduct = asyncHandler(async (req, res) => {
    const { productName, description, price, quantity, category } = req.body
    const imageLocalPath = req?.files


    if (!productName || !description || !price || !quantity || !category || !imageLocalPath) {
        throw new ApiError(406, "All fields Required")
    }

    const image = await Promise.all(imageLocalPath.map(async (img) => {
        let imglocalpath = img.path
        return await uploadOnCloudinary(imglocalpath, true)
    }))


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
            image,
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
    const { category } = req.body

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

const getCategory = asyncHandler(async (req, res) => {
    const categories = await Category.find({});
    if (!categories || categories.length === 0) {
        throw new ApiError(404, "No categories found");
    }
    return res.status(200).json(
        new ApiResponse(200, categories, "Categories fetched successfully")
    );
})

const updateCategory = asyncHandler(async (req, res) => {
    const { categoryName } = req.body
    const { categoryId } = req.params

    if (!categoryName || !categoryId) {
        throw new ApiError(406, "Category name and ID are required")
    }

    const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { categoryName },
        { new: true }
    )

    if (!updatedCategory) {
        throw new ApiError(404, "Category not found")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedCategory, "Category updated successfully")
    )
})

const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.body

    if (!categoryId) {
        throw new ApiError(406, "Category ID is required")
    }

    const deletedCategory = await Category.findByIdAndDelete(categoryId)

    if (!deletedCategory) {
        throw new ApiError(404, "Category not found")
    }

    return res.status(200).json(
        new ApiResponse(200, deletedCategory, "Category deleted successfully")
    )
})

const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.body
    if (!productId) {
        throw new ApiError(500, "something went wrong")
    }

    const product = await Product.findOne({ productId })

    if (!product) {
        throw new ApiError(404, "No Product found")
    }

    const deletedProduct = await Product.findByIdAndDelete(product._id)
    deletedProduct.image.forEach(async (img) => {
        await deleteFromCloudinary(img)
    })

    return res
        .status(200)
        .json(new ApiResponse(
            200, deletedProduct, "Product Deleted"
        ))
})

const updateProduct = asyncHandler(async (req, res) => {
    const { productName, description, price, category } = req.body
    const { productId } = req.params

    if ([productName, description, price, category].some((feild) => {
        return feild?.trim() === ""
    })) {
        throw new ApiError(406, "All fields required")
    }

    let productCategory = await Category.findOne({ categoryName: category })


    if (!productCategory) {
        throw new ApiError(404, "Category Not found")
    }


    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            productName,
            description,
            price,
            category: productCategory
        },
        { new: true }
    )

    if (!updatedProduct) {
        throw new ApiError(506, "Something went wrong while Updating Product")
    }



    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedProduct,
            "Product Updated Successfully"
        ))


})

const getAllProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 3, query, sortBy, sortType } = req.query

    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const skip = (pageNumber - 1) * limitNumber

    const sortOrder = sortType === "descending" ? -1 : 1

    const queryObject = {}
    if (query) {
        queryObject.$or = [
            { productId: { $regex: query, $options: "i" } },
            { productName: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ]
    }

    const totalProduct = await Product.countDocuments(queryObject)
    const fetchedProduct = await Product.aggregate([
        { $match: queryObject },
        {
            $sort: { [sortBy]: sortOrder }
        },
        { $skip: skip },
        { $limit: limitNumber }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                fetchedProduct,
                "page": pageNumber,
                "limit": limitNumber,
                totalProduct,
                "totalPages": Math.ceil(totalProduct / limitNumber)
            }
        )
    )
})

const getProduct = asyncHandler(async (req, res) => {
    const { product_id } = req.params

    if (!product_id) {
        throw new ApiError(403, "product Id required")
    }

    const product = await Product.findById(product_id)

    if (!product) {
        throw new ApiError(404, "Product Not Found")
    }

    return res.status(200).json(
        new ApiResponse(
            200, product, "Product Fetched Successfully"
        )
    )
})

module.exports = {
    createProduct,
    createCategory,
    deleteProduct,
    updateProduct,
    getAllProducts,
    getProduct,
    getCategory,
    updateCategory,
    deleteCategory,
}