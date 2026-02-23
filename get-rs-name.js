const mongoose = require('mongoose');
const URI = "mongodb://abhijithmk638_db_user:1pKIyXn0hLcIDBWn@ac-grcr3ly-shard-00-00.vtgvv1q.mongodb.net:27017/Bus-Tracker?ssl=true&authSource=admin&directConnection=true";

async function getRSInfo() {
    try {
        await mongoose.connect(URI);
        const admin = mongoose.connection.db.admin();
        const info = await admin.command({ hello: 1 });
        console.log('REPLICA SET NAME:', info.setName);
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}

getRSInfo();
