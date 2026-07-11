const Resume = require('../models/Resume');
const ResumeVersion = require('../models/ResumeVersion');

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

// @desc    Get all versions for a resume
// @route   GET /api/resumes/:id/versions
exports.getVersions = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (resume.userId !== String(req.user._id) && resume.userId !== 'anonymous') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const versions = await ResumeVersion.find({ resumeId }).sort({ createdAt: -1 });
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
};

// @desc    Create a new version for a resume
// @route   POST /api/resumes/:id/versions
exports.createVersion = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const { data } = req.body;
    
    if (!data) return res.status(400).json({ error: 'Resume data is required' });

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    
    if (resume.userId !== String(req.user._id) && resume.userId !== 'anonymous') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const versions = await ResumeVersion.find({ resumeId }).sort({ createdAt: -1 });
    const versionNumber = versions.length > 0 ? versions[0].versionNumber + 1 : 1;

    const newVersion = new ResumeVersion({
      resumeId,
      userId: req.user._id,
      versionNumber,
      name: data.name || resume.name,
      data
    });

    await newVersion.save();

    if (versions.length >= 20) {
      const versionsToDelete = versions.slice(19);
      for (const v of versionsToDelete) {
        await ResumeVersion.findByIdAndDelete(v._id);
      }
    }

    res.status(201).json(newVersion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create version' });
  }
};

// @desc    Delete a resume version
// @route   DELETE /api/resumes/versions/:versionId
exports.deleteVersion = async (req, res) => {
  try {
    const versionId = req.params.versionId;
    const version = await ResumeVersion.findById(versionId);
    if (!version) return res.status(404).json({ error: 'Version not found' });

    if (version.userId !== String(req.user._id) && version.userId !== 'anonymous') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await ResumeVersion.findByIdAndDelete(versionId);
    res.json({ message: 'Version deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete version' });
  }
};

// @desc    Get a public resume by ID
// @route   GET /api/resumes/public/:id
exports.getPublicResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (!resume.isPublic) {
      return res.status(403).json({ error: 'This resume is private' });
    }

    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public resume' });
  }
};

// @desc    Toggle public status of a resume
// @route   PATCH /api/resumes/:id/public
exports.togglePublicStatus = async (req, res) => {
  try {
    const { isPublic } = req.body;
    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ error: 'isPublic must be a boolean' });
    }

    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.userId !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to modify this resume' });
    }

    resume.isPublic = isPublic;
    resume.lastModified = Date.now();
    await resume.save();
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update public status' });
  }
};
