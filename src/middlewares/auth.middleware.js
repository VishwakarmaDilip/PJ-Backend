const jwt = require('jsonwebtoken')
const asyncHandler = require('../utils/AsyncHandler')
const { User } = require('../models/user.model')
const { Owner } = require('../models/owner.model')
const { ApiError } = require('../utils/ApiError')



exports.verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        
        const token = req.cookies?.ownerAccessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }
        
        let decodedToken;
        
        try {
            decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        } catch (error) {
            decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_USER)
        }


        const owner = await Owner.findById(decodedToken._id).select("-password -refreshToken")

        if (!owner) {
            throw new ApiError(401, "Invalid access Token")
        }

     
        
        if (owner) {
            req.owner = owner
        }
        
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})


exports.userVerifyJWT = asyncHandler(async (req, _, next) => {
    try {
        
        const token = req.cookies?.userAccessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }
        
        let decodedToken;
        
        try {
            decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        } catch (error) {
            decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_USER)
        }


        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid access Token")
        }

     
        
        if (user) {
            req.user = user
        }
        
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})