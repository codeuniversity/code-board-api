const app = require("express")();
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const port = process.env.PORT || 4001;
const bodyParser = require("body-parser");
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var urlmongodb = 'mongodb://admin:testmongodb@codeboard-shard-00-00-iqwvb.mongodb.net:27017,codeboard-shard-00-01-iqwvb.mongodb.net:27017,codeboard-shard-00-02-iqwvb.mongodb.net:27017/test?ssl=true&replicaSet=CodeBoard-shard-0&authSource=admin';
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);
const io = socketIo(server);

//Show Server Port
server.listen(port, () => console.log(`Listening on port ${port}`));
let temp = null;

//Test
app.get('/',(req,res)=>{
    console.log("/");
    res.send('Hello Worldd');
    res.send(temp);
});

let messages = []; // <- temporary, shoudl be a db

//Slack Zapier API REST
app.post('/slack',(req,res)=>{
    temp=req.body;
    console.log("-----SLACK-------");
    res.send({});
    let message = req.body;
    console.log(message);
    let slimMessage = {
        text:message.text,
        user:{
            name:message.user.name,
            profile:message.user.profile,
        }
    };
    console.log("------- SLACK SLIMMESSAGE -------");
    console.log(slimMessage);

    messages.push(slimMessage);
    io.emit("slack_message",slimMessage);

    //Connect to MongoDB & Insert slimMessage
    MongoClient.connect(urlmongodb, function(err, db) {
      assert.equal(null, err);
      console.log("Connected correctly to server.");
      insertDocument(db, function() {
        db.collection('slack').insertOne(slimMessage);
        console.log("+++ SlimMessage inserted to MongoDB +++");
        db.close();
      });
    });
});


//Calendar API Zapier REST
app.post('/calendar',(req, res)=>{
    console.log(req.body);
    res.send({});
    temp=req.body;
    console.log("-----CALENDAR-------");
    res.send({});
    let message = req.body;
    console.log(message);
    let slimMessage = {
          end:{
                dateTime:message.end.dateTime,
              },
          description:message.description,
          summary:message.summary,
          start:
          {
            time_pretty:message.start.time_pretty,
            dateTime:message.start.dateTime,
          },
          duration_minutes:message.duration_minutes,
          location:message.location,
          id:message.id,

    };
    console.log("------- CALENDAR SLIMMESSAGE -------");
    console.log(slimMessage);

    messages.push(slimMessage);
    io.emit("slack_message",slimMessage);

    //Connect to MongoDB & Insert slimMessage
    MongoClient.connect(urlmongodb, function(err, db) {
      assert.equal(null, err);
      console.log("Connected correctly to server.");
      insertDocument(db, function() {
        db.collection('calendar').insertOne(slimMessage);
        console.log("+++ SlimMessage (Calendar) inserted to MongoDB +++");
        db.close();
      });
    });
  });


//Send data to Socket.io
io.on("connection",(socket)=>{
    socket.emit("all_messages",messages); // <- REALLY temporary
    console.log("client connected");
    socket.on("disconnect",()=>{
        console.log("client disconnected");
    });
});
