const mongoose = require('mongoose');
require('dotenv').config();

const ResumeSchema = new mongoose.Schema({ name: String }, { strict: false });
const Resume = mongoose.model('ResumeTest', ResumeSchema, 'resumes');

async function testMongoose() {
  try {
    console.log('Connecting...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');
    
    console.log('Querying...');
    const count = await Resume.countDocuments();
    console.log('Total resumes:', count);
    
    const resumes = await Resume.find().limit(5);
    console.log('Sample resumes:');
    resumes.forEach(r => console.log(`- ${r.name} (${r._id})`));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

testMongoose();
