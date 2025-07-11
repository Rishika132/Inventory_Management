const express = require('express');
const router = express.Router();
const { exportSyncData } = require('../controller/exportSyncData.controller');
// const { auth } = require('../middleware/auth');

router.get('/export-sync', exportSyncData);

module.exports = router;
