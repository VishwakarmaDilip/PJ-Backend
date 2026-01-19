const { Router } = require('express')
<<<<<<< HEAD
const { verifyJWT, userVerifyJWT } = require('../middlewares/auth.middleware')
=======
const { userVerifyJWT, verifyJWT } = require('../middlewares/auth.middleware')
>>>>>>> 42641153fb39eed3762be1b09fd88e22d68da3c2
const { createOrder, getAllOrders, getOrder, cancelOrder, getRevenueAndOrders, fetchAllordersUser } = require('../controllers/order.controller')


const router = Router()

<<<<<<< HEAD
router.use(verifyJWT) || router.use(userVerifyJWT)


=======
router.use(userVerifyJWT) || router.use(verifyJWT)
>>>>>>> 42641153fb39eed3762be1b09fd88e22d68da3c2

router.route("/createOrder").post(createOrder)
router.route("/getAllOrders").get(getAllOrders)
router.route("/getOrder/:order_id").get(getOrder)
router.route("/cancelOrder/:order_id").post(cancelOrder)
router.route("/getRevenueAndOrders").get(getRevenueAndOrders)
router.route("/fetchAllOrdersUser").get(fetchAllordersUser)


module.exports = router