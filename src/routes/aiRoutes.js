const express = require('express');
const router = express.Router();
const { improveText, extractKeywords, analyzeJob, improveWithKeywords, fixWeakness, reviewResume, fixSpelling } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/improve', protect, improveText);
router.post('/extract-keywords', protect, extractKeywords);
router.post('/analyze-job', protect, analyzeJob);
router.post('/improve-with-keywords', protect, improveWithKeywords);
router.post('/fix-weakness', protect, fixWeakness);
router.post('/review', protect, reviewResume);
router.post('/fix-spelling', protect, fixSpelling);

module.exports = router;
