

 const { auth } = require('../middleware/auth');

const express = require('express');
const router = express.Router();
const { exportSyncData } = require('../controller/exportSyncData.controller');

// http://localhost:3000/export-sync

router.get('/export-sync',auth, exportSyncData); 

module.exports = router;

