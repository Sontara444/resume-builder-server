const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' },
  name: { type: String, required: true },
  lastModified: { type: Date, default: Date.now },
  personal: {
    fullName: String,
    title: String,
    email: String,
    phone: String,
    github: String,
    linkedin: String,
    location: String
  },
  summary: String,
  skills: [
    {
      id: String,
      category: String,
      items: [String]
    }
  ],
  projects: [
    {
      id: String,
      title: String,
      tech: String,
      description: [String],
      link: String
    }
  ],
  experience: [
    {
      id: String,
      company: String,
      position: String,
      duration: String,
      description: [String]
    }
  ],
  education: [
    {
      id: String,
      school: String,
      degree: String,
      duration: String,
      location: String
    }
  ],
  template: { type: String, default: 'vibrant' },
  themeColor: { type: String, default: '#ff9100' }
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
