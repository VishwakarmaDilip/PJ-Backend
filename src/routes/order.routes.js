const { Router } = require('express')
const { verifyJWT, userVerifyJWT} = require('../middlewares/auth.middleware')
const { createOrder, getAllOrders, getOrder, cancelOrder, getRevenueAndOrders, fetchAllordersUser, updateStatus } = require('../controllers/order.controller')

const router = Router()

// user
router.route("/createOrder").post(userVerifyJWT, createOrder)
router.route("/getOrder/user/:order_id").get(userVerifyJWT,getOrder)
router.route("/cancelOrder/user/:order_id").patch(userVerifyJWT,cancelOrder)
router.route("/fetchAllOrdersUser").get(userVerifyJWT,fetchAllordersUser)

// owner
router.use(verifyJWT)
router.route("/getAllOrders").get(getAllOrders)
router.route("/getOrder/:order_id").get(getOrder)
router.route("/cancelOrder/:order_id").patch(cancelOrder)
router.route("/getRevenueAndOrders").get(getRevenueAndOrders)
router.route("/updateStatus").patch(updateStatus)


module.exports = router
