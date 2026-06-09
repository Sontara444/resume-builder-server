const Resume = require('../models/Resume');

// @desc    Get all resumes
// @route   GET /api/resumes
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ lastModified: -1 });
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
      const existing = await Resume.findById(resumeData._id);
      if (!existing) {
        return res.status(404).json({ error: 'Resume not found' });
      }
      
      // Enforce user scoped ownership, allowing transition from anonymous if needed
      if (existing.userId !== String(req.user._id) && existing.userId !== 'anonymous') {
        return res.status(403).json({ error: 'Not authorized to modify this resume' });
      }

      const updated = await Resume.findByIdAndUpdate(
        resumeData._id,
        { ...resumeData, userId: req.user._id, lastModified: Date.now() },
        { returnDocument: 'after' }
      );
      return res.json(updated);
    }

    const newResume = new Resume({ ...resumeData, userId: req.user._id });
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
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.userId !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to delete this resume' });
    }

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

    if (original.userId !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to duplicate this resume' });
    }

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;

    duplicateData.name = `${duplicateData.name} (Copy)`;
    duplicateData.userId = req.user._id;
    duplicateData.lastModified = Date.now();

    const duplicate = new Resume(duplicateData);
    await duplicate.save();
    res.json(duplicate);
  } catch (err) {
    res.status(500).json({ error: 'Failed to duplicate resume' });
  }
};

// @desc    Rename a resume
// @route   PATCH /api/resumes/:id/rename
exports.renameResume = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.userId !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to modify this resume' });
    }

    resume.name = name.trim();
    resume.lastModified = Date.now();
    await resume.save();
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: 'Failed to rename resume' });
  }
};

// @desc    Update tags for a resume
// @route   PATCH /api/resumes/:id/tags
exports.updateTags = async (req, res) => {
  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }
    
    // Max 5 tags validation
    if (tags.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 tags allowed' });
    }

    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.userId !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to modify this resume' });
    }

    // Ensure tags are unique
    resume.tags = [...new Set(tags.map(t => t.trim()))].filter(Boolean);
    resume.lastModified = Date.now();
    await resume.save();
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tags' });
  }
};

