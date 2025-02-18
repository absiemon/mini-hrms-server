const multer = require('multer');

const storageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'profile')
            cb(null, './storage/images/profile/')
        else
            cb(null, false);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + file.originalname);
    }
})


const upload = multer({ storage: storageEngine });
module.exports = upload;