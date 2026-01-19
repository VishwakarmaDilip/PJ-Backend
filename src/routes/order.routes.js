const { Router } = require('express')
const { verifyJWT, userVerifyJWT } = require('../middlewares/auth.middleware')
const { createOrder, getAllOrders, getOrder, cancelOrder, getRevenueAndOrders, fetchAllordersUser } = require('../controllers/order.controller')


const router = Router()

router.use(verifyJWT) || router.use(userVerifyJWT)



router.route("/createOrder").post(createOrder)
router.route("/getAllOrders").get(getAllOrders)
router.route("/getOrder/:order_id").get(getOrder)
router.route("/cancelOrder/:order_id").post(cancelOrder)
router.route("/getRevenueAndOrders").get(getRevenueAndOrders)
router.route("/fetchAllOrdersUser").get(fetchAllordersUser)


module.exports = router