const mongoose = require('mongoose');
require('dotenv').config();
const Resume = require('./src/models/Resume');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    const resumes = await Resume.find({});
    for (let r of resumes) {
      if (r.name && r.name.includes('(Copy')) {
        let baseName = r.name.replace(/\s*\(Copy(?: \d+)?\)/g, '').trim();
        r.name = baseName;
        await r.save();
        console.log(`Updated to ${r.name}`);
      }
    }
    console.log('Done');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
