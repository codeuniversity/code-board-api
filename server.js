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

var messages = [];

//Show Server Port
server.listen(port, () => console.log(`Listening on port ${port}`));
let temp = null;

//Test
app.get('/',(req,res)=>{
    console.log("/");
    res.send('Hello World');
    res.send(temp);
});

//Show all Inserted Slack & Calender Itmes from MongoDB
MongoClient.connect(urlmongodb, function(err, db) {
  if (err) throw err;
  db.collection("slack").find({}).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
    console.log("All Slack Items printed!");
    messages = result;
    db.close();
  });
  db.collection("calendar").find({}).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
    console.log("All Calendar Items printed!");
    var allcalendar = result;
    db.close();
  });
});

var messages = []; // <- temporary, shoudl be a db

var date = new Date();
var current_hour = date.getHours();
var current_minutes = date.getMinutes();
var current_time = current_hour + ":" + current_minutes;

//Slack Zapier API REST
app.post('/slack',(req,res)=>{
    temp=req.body;
    console.log("-----SLACK-------");
    //Verify Slack
    //let challengeresponsponse = req.body.challenge;
    //res.send(challengeresponsponse);
    res.send({});
    let messageSlack = req.body;
    let team_id = 'T54B2S3T9'
    if(req.body.team_id == team_id){
      console.log(messageSlack);
      messages.push(messageSlack);
      io.emit("slack_message",messageSlack);
    };

    //Defining Slack Insert function
    var insertSlack = function(db, callback) {
       db.collection('slack').insertOne(messageSlack, function(err, result) {
        assert.equal(err, null);
        console.log("+++ Inserted a document into the slack collection +++");
        callback();
      });
    };

    //Connect to MongoDB & Insert slimMessage (Slack)
    MongoClient.connect(urlmongodb, function(err, db) {
      assert.equal(null, err);
      insertSlack(db, function() {
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
    let messageCalendar = req.body;
    console.log(messageCalendar);
    messages.push(messageCalendar);
    io.emit("slack_message",messageCalendar);

    //Defining Calendar Insert function
    var insertCalendar = function(db, callback) {
       db.collection('calendar').insertOne( messageCalendar, function(err, result) {
        assert.equal(err, null);
        console.log("+++ Inserted a document into the calendar collection +++");
        callback();
      });
    };

    //Connect to MongoDB & Insert slimMessage (Calendar)
    MongoClient.connect(urlmongodb, function(err, db) {
      assert.equal(null, err);
      insertCalendar(db, function() {
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

// -----SLACK-------
// { token: '7XzZXOewwL9PSRVbWuZCNUgQ',
//   team_id: 'T54B2S3T9',
//   api_app_id: 'A7QTK0DUN',
//   event:
//    { type: 'message',
//      user: 'U68MZMMLP',
//      text: 'test',
//      ts: '1508970457.000114',
//      channel: 'G7JRCFJSG',
//      event_ts: '1508970457.000114' },
//   type: 'event_callback',
//   event_id: 'Ev7Q24GJRG',
//   event_time: 1508970457,
//   authed_users: [ 'U68MZMMLP' ] }
// +++ Inserted a document into the slack collection +++
