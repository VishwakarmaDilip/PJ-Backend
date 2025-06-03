const { Address } = require("../models/address.model")
const { User } = require("../models/user.model")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const asyncHandler = require("../utils/AsyncHandler")
const { uploadOnCloudinary, deleteFromCloudinary } = require("../utils/Cloudinary")


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findOne(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()


        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        )
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user detail    
    const { fullName, email, username, password } = req.body

    // validate - not empty
    let isEmpty = [fullName, email, username, password]
    isEmpty = isEmpty.some((feild) => {
        return feild?.trim() === ""
    })

    if (isEmpty) {
        throw new ApiError(406, "All feilds Required")
    }

    // check if user already exist: username, email
    const existedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )

    if (existedUser) {
        throw new ApiError(409, "user with Email or Username already exists")
    }

    // create user object - create entry in DB
    const user = await User.create(
        {
            fullName,
            email,
            password,
            username: username.toLowerCase()
        }
    )

    // remove password and refresh token feild from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Somthing went wrong while registering the User")
    }

    // return response
    return res
        .status(200)
        .json(
            new ApiResponse(200, createdUser, "User Registered Successfully.")
        )
})

const loginUser = asyncHandler(async (req, res) => {
    // get data
    const { identifier, password } = req.body

    // check for username or email
    if (!identifier) {
        throw new ApiError(406, "username or email is required")
    }

    // find the User
    const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],

    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // generate access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    // Send cookie response
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const option = {
        httpOnly: true,
        secure: true,
    }


    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Logged In Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
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
    }

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "User Logged out"))
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    // console.log("oldPassword", oldPassword);

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, {}, "Invalid Old password")
    }

    user.password = newPassword

    await user.save({ validateBeforeSave: false })

    await User.findByIdAndUpdate(
        req.user._id,
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
    }

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(
            new ApiResponse(200, "Password changed successfully")
        )


})

const updateAccountDetail = asyncHandler(async (req, res) => {
    const { fullName, mobile, email } = req.body

    if (!fullName && !email && !mobile) {
        throw new ApiError(406, "At least one feild is required..!!")
    }

    const user = await User.findOneAndUpdate(
        req.user?._id,
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
        .json(new ApiResponse(200, user, "Account detail updated successfully"))
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req?.file?.path
    const user = await User.findById(req.user)
    const oldAvatar = user?.avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(406, "Something went wrong while uploading the image")
    }

    user.avatar = avatar
    await user.save({ validateBeforeSave: false })
    const upadatedUser = await User.findById(user._id).select("-password -refreshToken")

    if (oldAvatar) {
        await deleteFromCloudinary(oldAvatar)
    }

    return res
        .status(200)
        .json(new ApiResponse(200, upadatedUser, "User detail updated successfully"))
})

const getUserDetail = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("_id fullName email username mobile avatar")
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User detail fetched successfully"))
})




const createAddress = asyncHandler(async (req, res) => {
    const { address, area, city, pinCode, state } = req.body

    if (!address || !area || !city || !pinCode || !state) {
        throw new ApiError(406, "All feilds are required")
    }

    const newAddress = await Address.create({
        customer: req.user._id,
        address,
        area,
        city,
        pinCode,
        state
    })
    if (!newAddress) {
        throw new ApiError(500, "Something went wrong while creating the address")
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $push: {
                address: newAddress._id
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, newAddress, "Address created successfully"))
})

const getAllAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select(
        "-password -refreshToken -address -avatar -mobile -cart -wishList -orders"
    )
    const AllAddress = await User.aggregate([
        {
            $match: {
                _id: user._id
            }
        },
        {
            $lookup: {
                from: "addresses",
                localField: "address",
                foreignField: "_id",
                as: "addressDetail"
            }
        },
        {
            $unwind: "$addressDetail"
        },
        {
            $project: {
                    _id: "$addressDetail._id",
                    address: "$addressDetail.address",
                    area: "$addressDetail.area",
                    city: "$addressDetail.city",
                    pinCode: "$addressDetail.pinCode",
                    state: "$addressDetail.state"
            }
        }
    ])

    if (!AllAddress || AllAddress.length === 0) {
        throw new ApiError(404, "No address found for this user")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {user, AllAddress}, "Addresses fetched successfully"))

})

const getAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params

    if (!addressId) {
        throw new ApiError(406, "Address ID is required")
    }
    
    const address = await Address.findById(addressId)
    if (!address) {
        throw new ApiError(404, "Address not found")
    }
    if (address.customer.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to access this address")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, address, "Address fetched successfully"))
})

const updateAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params
    const { address, area, city, pinCode, state } = req.body

    if (!addressId) {
        throw new ApiError(406, "Address ID is required")
    }

    if (!address || !area || !city || !pinCode || !state) {
        throw new ApiError(406, "All fields are required")
    }

    const updatedAddress = await Address.findByIdAndUpdate(
        addressId,
        {
            address,
            area,
            city,
            pinCode,
            state
        },
        { new: true }
    )

    if (!updatedAddress) {
        throw new ApiError(404, "Address not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedAddress, "Address updated successfully"))
})

const deleteAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params

    if (!addressId) {
        throw new ApiError(406, "Address ID is required")
    }

    const address = await Address.findByIdAndDelete(addressId)
    if (!address) {
        throw new ApiError(404, "Address not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, address, "Address deleted successfully"))
})
 

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    changeCurrentPassword,
    updateAccountDetail,
    updateAvatar,
    getUserDetail,
    createAddress,
    getAllAddress,
    getAddress,
    updateAddress,
    deleteAddress
}