const { Owner } = require("../models/owner.model")
const { User } = require("../models/user.model")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const asyncHandler = require("../utils/AsyncHandler")
const { uploadOnCloudinary, deleteFromCloudinary } = require("../utils/Cloudinary")



const generateAccessAndRefreshToken = async (ownerId) => {

    try {
        const owner = await Owner.findById(ownerId)
        const accessToken = owner.generateAccessToken()
        const refreshToken = owner.generateRefreshToken()

        owner.refreshToken = refreshToken
        owner.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        console.error("Token generation error:", error)
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        )
    }
}

const registerOwner = asyncHandler(async (req, res) => {
    // get owner detail    
    const { fullName, email, username, password } = req.body

    // validate - not empty
    let isEmpty = [fullName, username, password]
    isEmpty = isEmpty.some((feild) => {
        return feild?.trim() === ""
    })

    if (isEmpty) {
        throw new ApiError(406, "All feilds Required")
    }

    // check if user already exist: username, email
    const existedOwner = await Owner.findOne(
        {
            $or: [{ email }, { username }]
        }
    )

    if (existedOwner) {
        throw new ApiError(409, "Owner with this Email or Username already exists")
    }

    // create owner object - create entry in DB
    const owner = await Owner.create(
        {
            fullName,
            password,
            email,
            username: username.toLowerCase()
        }
    )

    // remove password and refresh token feild from response
    const createdOwner = await Owner.findById(owner._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if (!createdOwner) {
        throw new ApiError(500, "Somthing went wrong while registering the User")
    }

    // return response
    return res
        .status(200)
        .json(
            new ApiResponse(200, createdOwner, "Owner Registered Successfully.")
        )
})

const loginOwner = asyncHandler(async (req, res) => {
    // get data
    const { identifier, password } = req.body


    // check for username or email
    if (!identifier) {
        throw new ApiError(406, "username or email is required")
    }

    // find the User
    const owner = await Owner.findOne({
        $or: [{ email: identifier }, { username: identifier }],

    })

    if (!Owner) {
        throw new ApiError(404, "Owner does not exist")
    }

    // password check
    const isPasswordValid = await owner.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // generate access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(owner._id)

    // Send cookie response
    const loggedInOwner = await Owner.findById(owner._id).select(
        "-password -refreshToken"
    )

    const option = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/"
    }


    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                200,
                {
                    owner: loggedInOwner, accessToken, refreshToken
                },
                "Owner Logged In Successfully"
            )
        )
})

const logoutOwner = asyncHandler(async (req, res) => {
    await Owner.findByIdAndUpdate(
        req.owner._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly: true,
        secure: true,
        // sameSite: "None",
    }

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "Owner Logged out"))
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    console.log("oldPassword", oldPassword);

    const owner = await Owner.findById(req.owner?._id)

    const isPasswordCorrect = await owner.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, {}, "Invalid Old password")
    }

    owner.password = newPassword

    await owner.save({ validateBeforeSave: false })

    await Owner.findByIdAndUpdate(
        req.owner._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly: true,
        secure: true,
        // sameSite: "None",
    }

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(
            new ApiResponse(200, "Password changed successfully")
        )


})

const updateAcountDetail = asyncHandler(async (req, res) => {
    const { fullName, email, mobile } = req.body

    if (!fullName && !email && !mobile) {
        throw new ApiError(406, "At least one feild is required..!!")
    }

    const owner = await Owner.findOneAndUpdate(
        req.owner?._id,
        {
            $set: {
                fullName,
                email,
                mobile
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, owner, "Account detail updated successfully"))
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req?.file?.path
    const owner = await Owner.findById(req.owner._id)
    const oldAvatar = owner?.avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(406, "Something went wrong while uploading the image")
    }

    owner.avatar = avatar
    await owner.save({ validateBeforeSave: false })
    const malik = await Owner.findById(owner._id).select("-password -refreshToken")
    if (oldAvatar) {
        await deleteFromCloudinary(oldAvatar)
    }

    return res
        .status(200)
        .json(new ApiResponse(200, malik, "User detail updated successfully"))
})

const getAllCustomers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 3, query, sortBy, sortType } = req.query

    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const skip = (pageNumber - 1) * limitNumber

    const sortOrder = sortType === "descending" ? -1 : 1

    const queryObject = {}
    if (query) {
        queryObject.$or = [
            { username: { $regex: query, $options: "i" } },
            { fullName: { $regex: query, $options: "i" } },
            { mobile: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
        ]
    }

    const totalCustomers = await User.countDocuments(queryObject)
    const fetchedCustomers = await User.aggregate([
        { $match: queryObject },
        {
            $sort: { [sortBy]: sortOrder }
        },
        { $skip: skip },
        { $limit: limitNumber },
        {$unset: ["password", "refreshToken"]}
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                fetchedCustomers,
                "page": pageNumber,
                "limit": limitNumber,
                totalCustomers,
                "totalPages": Math.ceil(totalCustomers / limitNumber)
            }
        )
    )
})

const getCustomerDetail = asyncHandler(async (req, res) => {
    const { customerId } = req.params

    if (!customerId) {
        throw new ApiError(406, "Customer Id is required")
    }

    const customer = await User.findById(customerId).select("-password -refreshToken")

    if (!customer) {
        throw new ApiError(404, "Customer not found")
    }

    return res.status(200).json(new ApiResponse(200, customer, "Customer detail fetched successfully"))
})


module.exports = {
    registerOwner,
    loginOwner,
    logoutOwner,
    changeCurrentPassword,
    updateAcountDetail,
    updateAvatar,
    getAllCustomers,
    getCustomerDetail,
}