const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const asyncHandler = require("../utils/AsyncHandler");
const { stateMap } = require("../constants")


const pincodeServiceability = asyncHandler(async (req, res) => {
    const { pinCode } = req.params

    const response = await fetch(
        `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pinCode}`,
        {
            method: "GET",
            headers: {
                Authorization: `Token ${process.env.DELHIVERY_TOKEN_SECRET}`,
            },
        }
    )

    const data = await response.json();


    if (!data) {
        throw new ApiError(404, "Pincode not found or serviceability data not available");
    }

    const isPINCodelisted = data.delivery_codes.length === 0 ? false : true

    let city, state, serviceability;

    if (isPINCodelisted) {
        city = data.delivery_codes[0].postal_code.city
        state = stateMap[data.delivery_codes[0].postal_code.state_code]
        const remark = data.delivery_codes[0].postal_code.remarks;

        switch (remark) {
            case "":
                serviceability = true
                break;

            case "Embargo":
                serviceability = "Temporary Unserviceable"
                break;

            default:
                serviceability = false
                break;
        }

    } else {
        city = "Not Found"
        state = "Not Found"
        serviceability = false
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { city, state, serviceability }, "Pincode serviceability data fetched successfully")
        );

})

const pincodeServiceabilityAllPinCode = asyncHandler(async (req, res) => {
    const { pinCode } = req.params

    const response = await fetch(
        `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pinCode}`,
        {
            method: "GET",
            headers: {
                Authorization: `Token ${process.env.DELHIVERY_TOKEN_SECRET}`,
            },
        }
    )

    const data = await response.json();


    if (!data) {
        throw new ApiError(404, "Pincode not found or serviceability data not available");
    }

    const isPINCodelisted = data.delivery_codes.length === 0 ? false : true

    let serviceability;

    if (isPINCodelisted) {
        const remark = data.delivery_codes[0].postal_code.remarks;

        switch (remark) {
            case "":
                serviceability = true
                break;

            case "Embargo":
                serviceability = "Temporary Unserviceable"
                break;

            default:
                serviceability = false
                break;
        }

    } else {
        serviceability = false
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { serviceability }, "Pincode serviceability data fetched successfully")
        );
})


module.exports = {
    pincodeServiceability,
    pincodeServiceabilityAllPinCode
}