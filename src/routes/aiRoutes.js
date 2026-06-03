const express = require('express');
const router = express.Router();
const { improveText } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/improve', protect, improveText);

module.exports = router;
