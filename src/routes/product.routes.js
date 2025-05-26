const { Router } = require("express");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { addProduct } = require("../controllers/product.controller");


const router = Router()
router.use(verifyJWT)

router.route("/addProduct").post(addProduct)

module.exports = router