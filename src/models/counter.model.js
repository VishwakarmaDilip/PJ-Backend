const mongoose = require("mongoose");


const counterSchema = new mongoose.Schema(
    {
        id: {
            type: String
        },
        sequence: {
            type: Number,
            default: 0
        }
    }
)

module.exports.Counter = mongoose.model("Counter", counterSchema)