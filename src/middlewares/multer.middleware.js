const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/\s+/g, '-');
        cb(null, safeName)
    }
})

exports.upload = multer({
    storage,
})