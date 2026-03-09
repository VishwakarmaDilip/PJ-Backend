const jwt = require('jsonwebtoken')
const asyncHandler = require('../utils/AsyncHandler')
const { User } = require('../models/user.model')
const { Owner } = require('../models/owner.model')
const { ApiError } = require('../utils/ApiError')



exports.verifyJWT = asyncHandler(async (req, res, next) => {

    const ownerToken =
        req.cookies?.ownerAccessToken ||
        req.header("Authorization")?.replace("Bearer ", "")

    if (ownerToken) {
        try {
            const decoded = jwt.verify(ownerToken, process.env.ACCESS_TOKEN_SECRET)

            const owner = await Owner.findById(decoded._id)
                .select("-password -refreshToken")

            if (owner) {
                req.owner = owner
                return next()
            }
        } catch (error) { }
    }
    throw new ApiError(401, "Unauthorized Request")
})

exports.userVerifyJWT = asyncHandler(async (req, res, next) => {

    const userToken =
        req.cookies?.userAccessToken ||
        req.header("Authorization")?.replace("Bearer ", "")

    if (userToken) {
        try {
            const decoded = jwt.verify(userToken, process.env.ACCESS_TOKEN_SECRET_USER)

            const user = await User.findById(decoded._id)
                .select("-password -refreshToken")

            if (user) {
                req.user = user
                return next()
            }
        } catch (error) { }
    }

    throw new ApiError(401, "Unauthorized Request")
})

