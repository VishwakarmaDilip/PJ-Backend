const { Router } = require("express");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { createProduct, createCategory } = require("../controllers/product.controller");
const { upload } = require("../middlewares/multer.middleware");


const router = Router()
router.use(verifyJWT)

router.route("/createProduct").post(upload.single("image"), createProduct)
router.route("/createCategory").post(createCategory)

module.exports = router