const express = require('express');
const cors = require('cors');
// const jwt = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port =  process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mkg81.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        // console.log('database connected');
        const serviceCollection = client.db('doctors-portal').collection('services');
        const bookingCollection = client.db('doctors-portal').collection('bookings');
        const userCollection = client.db('doctors-portal').collection('users');

        app.get('/service', async(req,res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.put('/user/:email', async(req, res) =>{
          const email = req.params.email;
          const user = req.body;
          const filter = {email: email};
          const options = {upsert: true};
          const updateDoc = {
            $set: user,
          };
          const result = await userCollection.updateOne(filter, updateDoc, options);
          const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
          res.send({result, token});
        })

        // warnings:
        // This is not the proper way to query
        // after learng more about  mongodb. use aggregate lookup, pipeline, match, group

        app.get('/available', async(req, res) =>{
          const date = req.query.date;
          // step 1: get all services

          const services = await serviceCollection.find().toArray();

          // step 2: get the booking of the day. output: [{}, {}, {}, {}, {}]
          const query = {date: date};
          const bookings = await bookingCollection.find(query).toArray();

          // step 3: for each service 
          services.forEach(service => {
            // step 4: find the bookings for that service . output: [{}, {}, {} , {}]
            const serviceBookings = bookings.filter(book => book.treatment === service.name);
            // step 5: select slots for the service Bookings: ['', '', '', '']
            const bookedSlots = serviceBookings.map(book => book.slot);
            // step 6: select those slots that are not in bookSlots
            const available = service.slots.filter(slot => !bookedSlots.includes(slot));
            // step 7: set available to slots to make it easier
            // service.available = available;
            service.slots = available;
          });
          

          res.send(services);
        })

        /**
         * API naming convention
         * app.get('/booking) // get all bookings . or get more than one or by filer
         * app.get('/booking/:id') // get a specific bookihn
         * app.get('/booking') // add a new booking
         * app.patch('/booking/:id') // add a new booking/update
         * app.put('/booking/:id') //update (if exists) or insert (if doesn't exists)
         * app.delete('/booking/:id') // add a new booking
         */

        app.get('/booking', async(req, res) => {
          const patient = req.query.patient;
          const query = {patient: patient};
          const bookings = await bookingCollection.find(query).toArray();
          res.send(bookings);
        })

        app.post('/booking', async(req, res) =>{
          const booking = req.body;
          const query = {treatment: booking.treatment, date: booking.date, patient: booking.patient}
          const exists = await bookingCollection.findOne(query);
          if(exists){
            return res.send({success: false, booking: exists})
          }
          const result = await bookingCollection.insertOne(booking);
          return res.send({success: true, result});
        })


    }
    finally{

    }

}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from Doctors portal')
})

app.listen(port, () => {
  console.log(`Doctors app listening on port ${port}`)
})