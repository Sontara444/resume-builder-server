const express = require('express');
const router = express.Router();
const { 
  getResumes, 
  saveResume, 
  deleteResume, 
  duplicateResume,
  renameResume,
  updateTags,
  getVersions,
  createVersion,
  deleteVersion,
  getPublicResume,
  togglePublicStatus
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

// Public route (accessible without authentication)
router.get('/public/:id', getPublicResume);

// Apply JWT verification layer
router.use(protect);

router.get('/', getResumes);
router.post('/', saveResume);
router.delete('/:id', deleteResume);
router.post('/:id/duplicate', duplicateResume);
router.patch('/:id/rename', renameResume);
router.patch('/:id/tags', updateTags);
router.patch('/:id/public', togglePublicStatus);

router.get('/:id/versions', getVersions);
router.post('/:id/versions', createVersion);
router.delete('/versions/:versionId', deleteVersion);

module.exports = router;
