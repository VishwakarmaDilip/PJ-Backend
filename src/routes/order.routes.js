const { Router } = require('express')
const { verifyJWT } = require('../middlewares/auth.middleware')
const { createOrder, getAllOrders, getOrder, cancelOrder, getRevenueAndOrders } = require('../controllers/order.controller')


const router = Router()

router.use(verifyJWT)

router.route("/createOrder").post(createOrder)
router.route("/getAllOrders").get(getAllOrders)
router.route("/getOrder/:order_id").get(getOrder)
router.route("/cancelOrder/:order_id").post(cancelOrder)
router.route("/getRevenueAndOrders").get(getRevenueAndOrders)


module.exports = router