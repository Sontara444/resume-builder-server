const express = require('express');
const router = express.Router();
const { improveText, extractKeywords } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/improve', protect, improveText);
router.post('/extract-keywords', protect, extractKeywords);

module.exports = router;
