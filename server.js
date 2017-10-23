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
    res.send('Hello World');
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
    var slimMessageSlack = {
        text:message.text,
        user:{
            name:message.user.name,
            profile:message.user.profile,
        }
    };
    console.log("------- SLACK SLIMMESSAGE -------");
    console.log(slimMessageSlack);

    messages.push(slimMessageSlack);
    io.emit("slack_message",slimMessageSlack);

    //Defining Slack Insert function
    var insertSlack = function(db, callback) {
       db.collection('slack').insertOne(slimMessageSlack, function(err, result) {
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
    let message = req.body;
    console.log(message);
    var slimMessageCalendar = {
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
    console.log(slimMessageCalendar);

    messages.push(slimMessageCalendar);
    io.emit("slack_message",slimMessageCalendar);

    //Defining Calendar Insert function
    var insertCalendar = function(db, callback) {
       db.collection('calendar').insertOne( slimMessageCalendar, function(err, result) {
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

//Show all Inserted Slack & Calender Itmes from MongoDB
var findSlack = function(db, callback) {
   var cursor =db.collection('slack').find( );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};
MongoClient.connect(urlmongodb, function(err, db) {
  assert.equal(null, err);
  findSlack(db, function() {
      db.close();
      console.log("All Slack Items printed!");

  });
});
var findCalendar = function(db, callback) {
   var cursor =db.collection('calendar').find( );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};
MongoClient.connect(urlmongodb, function(err, db) {
  assert.equal(null, err);
  findCalendar(db, function() {
      db.close();
      console.log("All Calendar Items printed!");
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
