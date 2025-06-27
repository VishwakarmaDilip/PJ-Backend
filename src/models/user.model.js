const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trime: true,
            index: true,
            lowercase: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
        },
        mobile: {
            type: Number,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        address: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Address"
            },
        ],
        orders: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order"
            }
        ],
        wishList: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            }
        ],
        cart: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cart"
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String
        }
    }, { timestamps: true }
);

// handle Password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return (next())
    }

    this.password = await bcrypt.hash(this.password, 10);
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}


// handle token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET_USER,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY_USER
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET_USER,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY_USER
        }
    )
}

exports.User = mongoose.model("User", userSchema)