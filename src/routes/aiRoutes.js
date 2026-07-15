const express = require('express');
const router = express.Router();
const { improveText, extractKeywords, analyzeJob, improveWithKeywords } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/improve', protect, improveText);
router.post('/extract-keywords', protect, extractKeywords);
router.post('/analyze-job', protect, analyzeJob);
router.post('/improve-with-keywords', protect, improveWithKeywords);

module.exports = router;
