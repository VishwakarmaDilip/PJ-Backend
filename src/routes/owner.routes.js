const { Router } = require('express')
const {
    registerOwner,
    loginOwner,
    logoutOwner,
    changeCurrentPassword,
    updateAcountDetail,
    updateAvatar,
    getAllCustomers,
    getCustomerDetail
} = require('../controllers/owner.controller')
const { upload } = require('../middlewares/multer.middleware')
const { verifyJWT } = require('../middlewares/auth.middleware')


const router = Router()

router.route("/register").post(upload.none(), registerOwner)
router.route("/login").post(loginOwner)


// secured routes
router.route("/logout").post(verifyJWT, logoutOwner)
router.route("/changeCurrentPassword").patch(verifyJWT, changeCurrentPassword)
router.route("/updateAcountDetail").patch(verifyJWT, updateAcountDetail)
router.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)
router.route("/getAllCustomers").get(verifyJWT, getAllCustomers)
router.route("/getCustomer/:customerId").get(verifyJWT,getCustomerDetail)



module.exports = router