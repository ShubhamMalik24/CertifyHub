const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/certifyhub');
    console.log('Connected to MongoDB');

    let admin = await User.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      admin = new User({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: 'Admin123!',
        role: 'admin',
        bio: 'Administrator',
        skills: ['Management'],
      });
      console.log('Admin user created');
    } else {
      admin.password = 'Admin123!';
      console.log('Admin password updated');
    }

    await admin.save();
    console.log('Admin user: admin@gmail.com / Admin123!');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error:', err);
  }
}

createAdmin();
