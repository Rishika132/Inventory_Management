
// http://localhost:3000/export-sync
// const { auth } = require('../middleware/auth');

const express = require('express');
const router = express.Router();
const { exportSyncData } = require('../controller/exportSyncData.controller');

router.get('/export-sync', exportSyncData); 

module.exports = router;

