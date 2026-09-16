const express = require('express');
const router = express.Router();
const { exportToPdf } = require('../controllers/exportController');

router.post('/pdf', exportToPdf);

module.exports = router;
