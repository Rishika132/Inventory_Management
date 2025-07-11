const express = require('express');
const multer = require('multer');
// const { auth } = require ("../middleware/auth.js");
const { handleCSVUpload } = require('../controller/csv.controller');

const upload = multer({ dest: '/tmp' });

const router = express.Router();

//http://localhost:3000/api/upload-csv?csv

router.post('/upload-csv', upload.single('csv'), handleCSVUpload);

module.exports = router;
