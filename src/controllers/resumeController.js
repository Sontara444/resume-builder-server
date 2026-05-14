const Resume = require('../models/Resume');

// @desc    Get all resumes
// @route   GET /api/resumes
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ lastModified: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
};

// @desc    Create or Update a resume
// @route   POST /api/resumes
exports.saveResume = async (req, res) => {
  try {
    const resumeData = req.body;

    if (resumeData._id) {
      const updated = await Resume.findByIdAndUpdate(
        resumeData._id,
        { ...resumeData, lastModified: Date.now() },
        { new: true }
      );
      return res.json(updated);
    }

    const newResume = new Resume(resumeData);
    await newResume.save();
    res.status(201).json(newResume);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save resume' });
  }
};

// @desc    Delete a resume
// @route   DELETE /api/resumes/:id
exports.deleteResume = async (req, res) => {
  try {
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resume' });
  }
};

// @desc    Duplicate a resume
// @route   POST /api/resumes/:id/duplicate
exports.duplicateResume = async (req, res) => {
  try {
    const original = await Resume.findById(req.params.id);
    if (!original) return res.status(404).json({ error: 'Resume not found' });

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;

    duplicateData.name = `${duplicateData.name} (Copy)`;
    duplicateData.lastModified = Date.now();

    const duplicate = new Resume(duplicateData);
    await duplicate.save();
    res.json(duplicate);
  } catch (err) {
    res.status(500).json({ error: 'Failed to duplicate resume' });
  }
};
