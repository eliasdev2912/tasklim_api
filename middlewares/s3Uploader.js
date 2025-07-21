const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');



const s3 = new AWS.S3({
  region: 'eu-north-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: 'tasklim-bucket',
    key: (req, file, cb) => {
      cb(null, `uploads/${Date.now()}_${file.originalname}`);
    }
  })
});


module.exports = upload