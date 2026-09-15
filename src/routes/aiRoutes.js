const express = require('express');
const router = express.Router();
const { improveText, extractKeywords, analyzeJob, improveWithKeywords, fixWeakness, reviewResume, fixSpelling, generateCoverLetter, generateSuggestions, chatCopilot, tailorResume, optimizeLayout, parsePdf, parseLinkedIn } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for memory storage (we just need the buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

router.post('/improve', protect, improveText);
router.post('/extract-keywords', protect, extractKeywords);
router.post('/analyze-job', protect, analyzeJob);
router.post('/improve-with-keywords', protect, improveWithKeywords);
router.post('/fix-weakness', protect, fixWeakness);
router.post('/review', protect, reviewResume);
router.post('/fix-spelling', protect, fixSpelling);
router.post('/generate-cover-letter', protect, generateCoverLetter);
router.post('/generate-suggestions', protect, generateSuggestions);
router.post('/chat', protect, chatCopilot);
router.post('/tailor', protect, tailorResume);
router.post('/optimize-layout', protect, optimizeLayout);
router.post('/parse-pdf', protect, upload.single('resumePdf'), parsePdf);
router.post('/parse-linkedin', protect, upload.single('linkedinPdf'), parseLinkedIn);

module.exports = router;
