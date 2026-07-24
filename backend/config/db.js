const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');

// Fix Windows DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore DNS config notice
}

const connectDB = async () => {
  const mongoURI =
    process.env.MONGODB_URI ||
    'mongodb+srv://rohitbanka4595_db_user:GBForbM63wyCDwJH@cluster0.ua4vmph.mongodb.net/eduspark?retryWrites=true&w=majority&appName=Cluster0';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📡 Cluster Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message || error);
    throw error;
  }
};

module.exports = connectDB;
