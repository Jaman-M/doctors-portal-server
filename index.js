const express = require('express');
const cors = require('cors');
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

        app.get('/service', async(req,res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        /**
         * API naming convention
         * app.get('/booking) // get all bookings . or get more than one or by filer
         * app.get('/booking/:id') // get a specific bookihn
         * app.get('/booking') // add a new booking
         * app.patch('/booking/:id') // add a new booking
         * app.delete('/booking/:id') // add a new booking
         */

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