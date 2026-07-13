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
  sectionOrder: {
    type: [String],
    default: ['summary', 'skills', 'experience', 'projects', 'education']
  },
  customSections: [
    {
      id: String,
      title: String,
      items: [
        {
          id: String,
          title: String,
          subtitle: String,
          duration: String,
          description: [String]
        }
      ]
    }
  ],
  template: { type: String, default: 'vibrant' },
  themeColor: { type: String, default: '#ff9100' },
  tags: { type: [String], default: [] },
  isPublic: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
