require('dotenv').config();
const app = require('express')();
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const port = process.env.PORT || 4001;
const bodyParser = require('body-parser');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const ObjectId = require('mongodb').ObjectID;
const urlmongodb = process.env.MONGO_URL;

app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);
const io = socketIo(server);


MongoClient.connect(urlmongodb, function (err, db) {
  app.post('/slack', (req, res) => {
    let message = req.body;
    io.emit("slack_message", slackSerializer(message));
    insertSlackMessage(db, message);
    res.send({});

    console.log("-----SLACK-------");
    console.log(message);

  });

  app.post('/calendar', (req, res) => {
    let message = req.body;
    io.emit("calendar_message", calendarSerializer(message));
    insertCalendarMessage(db, message);
    res.send({});

    console.log("-----CALENDAR-------");
    console.log(message);

  });

  //socket io
  io.on("connection", (socket) => {
    console.log("client connected");

    getSlackMessages(db, (messages) => {
      let slimMessages = messages.map(slackSerializer);
      io.emit("all_slack_messages", slimMessages);
    });

    getCalendarMessages(db, (messages) => {
      let slimMessages = messages.map(calendarSerializer);
      io.emit("all_calendar_messages", slimMessages);
    });

    socket.on("disconnect", () => {
      console.log("client disconnected");
    });
  });

  getCalendarMessages(db, (messages) => {
    console.log(`Calendar message count: ${messages.length}`);
  });
  getSlackMessages(db, (messages) => {
    console.log(`Slack message count: ${messages.length}`);
  });

  server.listen(port, () => console.log(`Listening on port ${port}`));
});


//helper functions

function getSlackMessages(db, cb) {
  db.collection('slack').find({}).toArray(function (err, result) {
    assert.equal(err, null);
    cb(result);
  });
}

function getCalendarMessages(db, cb) {
  db.collection('calendar').find({}).toArray(function (err, result) {
    assert.equal(err, null);
    cb(result);
  });
}

function insertSlackMessage(db, message) {
  db.collection('slack').insertOne(message, function (err, result) {
    assert.equal(err, null);
    console.log("+++ Inserted a document into the slack collection +++");
  });
}

function insertCalendarMessage(db, message) {
  db.collection('calendar').insertOne(message, function (err, result) {
    assert.equal(err, null);
    console.log("+++ Inserted a document into the calendar collection +++");
  });
}

function slackSerializer(message) {
  let slimMessage = {
    text: message.text,
    user: {
      name: message.user.name,
      profile: message.user.profile,
    }
  };
  return slimMessage;
}

function calendarSerializer(message) {
  let slimMessage = {
    end: {
      dateTime: message.end.dateTime,
    },
    description: message.description,
    summary: message.summary,
    start: {
      time_pretty: message.start.time_pretty,
      dateTime: message.start.dateTime,
    },
    duration_minutes: message.duration_minutes,
    location: message.location,
    id: message.id,

  };
  return slimMessage;

}