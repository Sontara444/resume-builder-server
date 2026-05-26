const express = require('express');
const router = express.Router();
const { 
  getResumes, 
  saveResume, 
  deleteResume, 
  duplicateResume 
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

// Apply JWT verification layer
router.use(protect);

router.get('/', getResumes);
router.post('/', saveResume);
router.delete('/:id', deleteResume);
router.post('/:id/duplicate', duplicateResume);

module.exports = router;
