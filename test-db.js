const mongoose = require('mongoose');
// node-0member of the shard
const URI = "mongodb://abhijithmk638_db_user:1pKIyXn0hLcIDBWn@ac-grcr3ly-shard-00-00.vtgvv1q.mongodb.net:27017/Bus-Tracker?ssl=true&authSource=admin&directConnection=true";

async function testConnection() {
    try {
        console.log('Connecting to MongoDB (DIRECT)...');
        await mongoose.connect(URI, { serverSelectionTimeoutMS: 10000 });
        console.log('SUCCESS: Connected to MongoDB!');
        const adminCollection = mongoose.connection.collection('admins');
        const count = await adminCollection.countDocuments();
        console.log(`Found ${count} admins.`);
        process.exit(0);
    } catch (err) {
        console.error('ERROR: Connection failed:', err.message);
        process.exit(1);
    }
}

testConnection();
