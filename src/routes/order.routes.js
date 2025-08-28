const { Router } = require('express')
const { verifyJWT } = require('../middlewares/auth.middleware')
const { createOrder, getAllOrders, getOrder } = require('../controllers/order.controller')


const router = Router() 

router.use(verifyJWT)

router.route("/createOrder").post(createOrder)
router.route("/getAllOrders").get(getAllOrders)
router.route("/getOrder/:order_id").get(getOrder)


module.exports = router