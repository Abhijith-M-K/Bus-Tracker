const mongoose = require('mongoose');
const URI = "mongodb://abhijithmk638_db_user:1pKIyXn0hLcIDBWn@ac-grcr3ly-shard-00-00.vtgvv1q.mongodb.net:27017/Bus-Tracker?ssl=true&authSource=admin&directConnection=true";

async function setupTestData() {
    try {
        await mongoose.connect(URI);
        console.log('Connected to DB');

        // 1. Ensure Route exists
        const Route = mongoose.model('Route', new mongoose.Schema({
            name: String,
            location: { lat: Number, lng: Number }
        }));

        let route = await Route.findOne({ name: 'Test Destination' });
        if (!route) {
            route = await Route.create({
                name: 'Test Destination',
                location: { lat: 11.2588, lng: 75.7804 } // Kozhikode
            });
            console.log('Created Route:', route.name);
        }

        // 2. Ensure Passenger exists
        const Passenger = mongoose.model('Passenger', new mongoose.Schema({
            name: String,
            phone: String,
            email: String
        }));

        let passenger = await Passenger.findOne({ email: 'test@example.com' });
        if (!passenger) {
            passenger = await Passenger.create({
                name: 'Test Passenger',
                phone: '1234567890',
                email: 'test@example.com'
            });
            console.log('Created Passenger:', passenger.name);
        }

        // 3. Create Ticket for today
        const Ticket = mongoose.model('Ticket', new mongoose.Schema({
            passengerId: mongoose.Schema.Types.ObjectId,
            busId: String,
            travelDate: Date,
            dropoff: String,
            pnr: String,
            ticketNo: String,
            pickup: String
        }));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await Ticket.deleteMany({ busId: 'TEST-BUS', travelDate: today });
        const ticket = await Ticket.create({
            passengerId: passenger._id,
            busId: 'TEST-BUS',
            travelDate: today,
            dropoff: 'Test Destination',
            pnr: 'PNR123',
            ticketNo: 'TKT123',
            pickup: 'Start point'
        });
        console.log('Created Ticket for today with Bus ID: TEST-BUS');

        // 4. Ensure Bus exists
        const Bus = mongoose.model('Bus', new mongoose.Schema({
            busId: { type: String, unique: true },
            busNumber: String,
            routeName: String,
            depo: String
        }));

        let bus = await Bus.findOne({ busId: 'TEST-BUS' });
        if (!bus) {
            bus = await Bus.create({
                busId: 'TEST-BUS',
                busNumber: 'KL-01-AB-1234',
                routeName: 'Test Route',
                depo: 'Test Depo'
            });
            console.log('Created Bus:', bus.busId);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

setupTestData();
