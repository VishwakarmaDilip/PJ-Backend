const { default: mongoose } = require("mongoose")
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

    if (!imageLocalPath || imageLocalPath.length === 0) {
        throw new ApiError(406, "Image is required")

    }

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

    let productCategory = await Category.findById(category)


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
            category
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
    const { product_id } = req.params
    if (!product_id) {
        throw new ApiError(406, "Product ID is required")
    }
    const deletedProduct = await Product.findByIdAndDelete(product_id)

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
    const { productName, description, price, category, quantity, previousImages } = req.body
    const { productId } = req.params
    const imageLocalPath = req?.files

    if ([productName, description, price, category, quantity, previousImages]?.some((feild) => {
        return feild?.trim() === ""
    })) {
        throw new ApiError(406, "All fields required")
    }


    const prevImg = previousImages?.split(",")?.filter((img) => img[0] === "h")

    const product = await Product.findById(productId)
    if (!product) {
        throw new ApiError(404, "Product Not Found")
    }

    const imagesToDelete = product.image.filter((img) => {
        return !prevImg.includes(img)
    })


    let image = []
    if (imageLocalPath) {
        image = await Promise.all(imageLocalPath.map(async (img) => {
            let imglocalpath = img.path
            return await uploadOnCloudinary(imglocalpath, true)
        }))

        if (!image) {
            throw new ApiError(406, "Something went wrong while uploading the image")
        }
    }

    let productCategory = await Category.findById(category)

    if (!productCategory) {
        throw new ApiError(404, "Category Not found")
    }

    product.image = [...prevImg, ...image]
    product.productName = productName
    product.description = description
    product.price = price
    product.category = productCategory
    product.quantity = quantity

    await product.save()

    const updatedProduct = await Product?.findOne({ productName })

    if (!updatedProduct) {
        throw new ApiError(506, "Something went wrong while Updating Product")
    }

    await Promise.all(
        imagesToDelete?.map(async (img) => {
            return await deleteFromCloudinary(img)
        })
    )



    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedProduct,
            "Product Updated Successfully"
        ))


})

const getAllProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType } = req.query

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
        { $limit: limitNumber },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category",
                pipeline: [
                    {
                        $project: {
                            categoryName: 1,
                        }
                    }
                ]
            }
        }
    ])

    const pageInfo = {
        page: pageNumber,
        limit: limitNumber,
        totalProduct,
        totalPages: Math.ceil(totalProduct / limitNumber)
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                fetchedProduct,
                pageInfo
            }
        )
    )
})

const getProduct = asyncHandler(async (req, res) => {
    const { product_id } = req.params

    if (!product_id) {
        throw new ApiError(403, "product Id required")
    }

    const product = await Product.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(product_id)
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category",
                pipeline: [
                    {
                        $project: {
                            categoryName: 1,
                            _id: -1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$category"
        },
        {
            $unset: [
                "createdAt",
                "updatedAt",
                "__v",
            ]

        }
    ])

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