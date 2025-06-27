const { Router } = require('express')
const { verifyJWT } = require('../middlewares/auth.middleware')
const { createOrder } = require('../controllers/order.controller')


const router = Router()

// router.use(verifyJWT)

router.route("/createOrder").post(createOrder)


module.exports = router