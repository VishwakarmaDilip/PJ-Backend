const { Router } = require("express");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { createProduct, createCategory, deleteProduct } = require("../controllers/product.controller");
const { upload } = require("../middlewares/multer.middleware");


const router = Router()
router.use(verifyJWT)

router.route("/createProduct").post(upload.array("image",4), createProduct)
router.route("/createCategory").post(createCategory)
router.route("/deleteProduct").post(deleteProduct)

module.exports = router