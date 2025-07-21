const express = require('express');
const multer = require('multer');
const { auth } = require ("../middleware/auth.js");
const { handleCSVUpload } = require('../controller/csv.controller');
const upload = require('../middleware/upload');

const router = express.Router();

//http://localhost:3000/api/upload-csv?csv

router.post('/upload-csv', upload.single('csv'),auth, handleCSVUpload);

module.exports = router;
