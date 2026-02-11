const { Router } = require("express");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { createProduct, createCategory, deleteProduct, updateProduct, getAllProducts, getProduct, getCategory, updateCategory, deleteCategory, productStatus} = require("../controllers/product.controller");
const { upload } = require("../middlewares/multer.middleware");


const router = Router()
router.use(verifyJWT)

router.route("/createProduct").post(upload.array("images", 4), createProduct)
router.route("/updateProduct/:productId").patch(upload.array("images", 4), updateProduct)
router.route("/getProducts").get(getAllProducts)
router.route("/getProduct/:product_id").get(getProduct)
router.route("/deleteProduct/:product_id").delete(deleteProduct)
router.route("/productStatus/:product_id").patch(productStatus)

router.route("/category/createCategory").post(createCategory)
router.route("/category/getCategories").get(getCategory)
router.route("/category/updateCategory/:categoryId").patch(updateCategory)
router.route("/category/deleteCategory").delete(deleteCategory)

module.exports = router