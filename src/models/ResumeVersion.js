const mongoose = require('mongoose');

const ResumeVersionSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  userId: { type: String, required: true },
  versionNumber: { type: Number, required: true },
  name: { type: String, required: true },
  data: { type: Object, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ResumeVersion', ResumeVersionSchema);
