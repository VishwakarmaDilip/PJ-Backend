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
    getUserDetail,
    createOrUpdateCart,
    getCart,
    updateProductInCart,
    deleteCart,
    addToList,
    getWishList,
    deleteProductfromList,
} = require("../controllers/user.controller");
const { upload } = require("../middlewares/multer.middleware");
const { getAllProducts, getProduct, getCategory } = require("../controllers/product.controller");


const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/getProducts").get(getAllProducts)
router.route("/getProduct/:product_id").get(getProduct)
router.route("/category/getCategories").get(getCategory)

// secure routes
router.use(verifyJWT)

router.route("/logout").post(logoutUser)
router.route("/changeCurrentPassword").put(changeCurrentPassword)
router.route("/updateAccount").patch(updateAccountDetail)
router.route("/updateAvatar").patch(upload.single("avatar"), updateAvatar)
router.route("/getUser").get(getUserDetail)

// Address routes
router.route("/address/createAddress").post(createAddress)
router.route("/address/getAllAddress").get(getAllAddress)
router.route("/address/:addressId").get(getAddress)
router.route("/address/update/:addressId").post(updateAddress)
router.route("/address/delete/:addressId").delete(deleteAddress)

// Cart and Wishlist routes
router.route("/cart/addToCart").post(createOrUpdateCart)
router.route("/cart/getCart").get(getCart)
router.route("/cart/updateProduct").patch(updateProductInCart)
router.route("/cart/deleteCart").delete(deleteCart)
router.route("/wish/addToList").patch(addToList)
router.route("/wish/getWishList").get(getWishList)
router.route("/wish/upadteWishList").patch(deleteProductfromList)


module.exports = router