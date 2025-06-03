const { Router } = require("express");
const { verifyJWT } = require("../middlewares/auth.middleware");
const {
    registerUser,
    loginUser,
    logoutUser,
    changeCurrentPassword,
    updateAccountDetail,
    updateAvatar,
    createAddress,
    getAllAddress,
    getAddress,
    updateAddress,
    deleteAddress,
    getUserDetail
} = require("../controllers/user.controller");
const { upload } = require("../middlewares/multer.middleware");


const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

// secure routes
router.use(verifyJWT)

router.route("/logout").post(logoutUser)
router.route("/changeCurrentPassword").put(changeCurrentPassword)
router.route("/updateAccount").patch(updateAccountDetail)
router.route("/updateAvatar").patch(upload.single("avatar"), updateAvatar)
router.route("/getUser").get(getUserDetail)

router.route("/address/createAddress").post(createAddress)
router.route("/address/getAllAddress").get(getAllAddress)
router.route("/address/:addressId").get(getAddress)
router.route("/address/update/:addressId").post(updateAddress)
router.route("/address/delete/:addressId").delete(deleteAddress)



module.exports = router
