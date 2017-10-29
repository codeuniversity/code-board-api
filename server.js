require('dotenv').config();
const app = require('express')();
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const port = process.env.PORT || 4001;
const bodyParser = require('body-parser');
const vbb = require('vbb-client');
const getGoogleEvents = require('./google');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const ObjectId = require('mongodb').ObjectID;
const Slack = require('./slack');
const Emoji = require('node-emoji');
const urlmongodb = process.env.MONGO_URL;
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);
const io = socketIo(server);
const calendarIntervalTime = 30 * 1000;
const criticalDelayTime = 5; //mins

MongoClient.connect(urlmongodb, function (err, db) {
  app.post('/slack', (req, res) => {
    let message = req.body;
    if(message.challenge){
      res.send(message.challenge);      
    }else{
      res.send({});  
      let event = message.event;
      if(event.type==='message' && event.channel && event.channel === 'G7JRCFJSG'){
        Slack.getUser(event.user,(profile)=>{
          event.user = profile;
          replaceAliases(db, event.text, (text)=>{
            event.text = text;
            insertSlackMessage(db, message.event);
            io.emit('slack_message', slackSerializer(message.event));  
          });
        });
      }      
      console.log("-----SLACK-------");
    }
   

  });

  //socket io
  io.on("connection", (socket) => {
    console.log("client connected");

    getSlackMessages(db, (messages) => {
      let slimMessages = messages.map(slackSerializer);
      socket.emit("all_slack_messages", slimMessages);
    });
    Slack.getEmojies((resp)=>{
      let emoji = resp.emoji;
      socket.emit('emoji',emoji);
    });
    giveDepartures(deps => {
      let delays = deps.map(vbbSerializer).filter(relevantLine).filter(massiveDelay);
      socket.emit('all_delays', delays);
    });

    getGoogleEvents((messages) => {
      let slimMessages = messages.map(calendarSerializer);
      socket.emit("all_calendar_messages", slimMessages);
    });
    socket.on("disconnect", () => {
      console.log("client disconnected");
    });
  });

  getSlackMessages(db, (messages) => {
    console.log(`Slack message count: ${messages.length}`);
  });
  getGoogleEvents((events) => {
    console.log(`Google event count: ${events.length}`);
  });
  
  setInterval(()=>updateAliases(db), 300 * 1000); // 5 mins
  server.listen(port, () => console.log(`Listening on port ${port}`));
});

setInterval(updateClients, calendarIntervalTime);

//helper functions
function updateClients() {
  getLatestCalendar();
  getDelays();
}

function getLatestCalendar() {
  getGoogleEvents((events) => {
    io.emit("all_calendar_messages", events.map(calendarSerializer));
  });
}

function getDelays() {
  giveDepartures((lines) => {
    let delays = lines.map(vbbSerializer).filter(relevantLine).filter(massiveDelay);
    io.emit('all_delays', delays);
  });
}
function updateAliases(db){
  Slack.getEmojies((resp)=>{
    let emoji = resp.emoji;
    let keys = Object.keys(emoji);
    let aliases = keys.filter(key=>{
      
      return emoji[key].indexOf('alias:') > -1;
    }).map(key=>{
      return {key:key,value:emoji[key].slice(6,emoji[key].length)};
    });
    console.log('dropping');
    db.dropCollection('alias').then((err,res)=>{
      insertAliases(db, aliases);
    },(fail)=>{
      insertAliases(db, aliases);
    });
  });
}
function getSlackMessages(db, cb) {
  db.collection('slack').find({}).toArray(function (err, result) {
    assert.equal(err, null);
    cb(result);
  });
}
function getAliases(db, cb) {
  db.collection('alias').find({}).toArray(function (err, result) {
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
function insertAliases(db,aliases) {
  db.collection('alias').insertMany(aliases,(err, result)=>{
    assert.equal(err, null);
    console.log("+++ Inserted an alias into the alias collection +++");    
  });
}
function replaceAliases(db, text ,cb){
  text = text || '';
  getAliases(db,(aliases)=>{
    // console.log(aliases);
    aliases.forEach(alias=>{
      text = text.replace(`:${alias.key}:`,`:${alias.value}:`);
    });
    cb(text);
  });
}
function slackSerializer(message) {
  let slimMessage = {
    text: Emoji.emojify(message.text),
    createdAt: new Date(message.ts * 1000),
    user: {
      profile: {
        large_image_url: message.user.profile.image_1024,
      },
    }
  };
  return slimMessage;
}


function calendarSerializer(message) {
  if(!message.start.dateTime && !message.end.dateTime) {
    message.start.dateTime = message.start.date+"T00:00:00+02:00";
    message.end.dateTime = message.end.date+"T23:59:59+02:00";
  }
  let slimMessage = {
    description: message.description,
    summary: message.summary,
    duration_minutes: message.duration_minutes,
    location: message.location,
    id: message.id,
    start: {
      time_pretty: message.start.time_pretty,
      very_pretty: getNiceDate(message.start.dateTime),
      dateTime: message.start.dateTime,
    },
    end: {
      time_pretty: message.end.time_pretty,
      very_pretty: getNiceDate(message.start.dateTime),
      dateTime: message.end.dateTime,
    },
  };
  return slimMessage;

}


function getNiceDate(dateTime) {
  var timeNow = new Date();
  var time = new Date(dateTime);
  var todayAsNumber = timeNow.getDate();
  var thisMonthAsNumber = timeNow.getMonth();
  var thisYearAsNumber = timeNow.getFullYear();
  if (timeNow.toDateString() === time.toDateString()) {
    return time.getHours() + ":" + getFormatedMinutes(time.getMinutes());
  } else if (todayAsNumber + 1 === time.getDate() && thisMonthAsNumber === time.getMonth() && thisYearAsNumber === time.getFullYear()) {
    return "" + time.getHours() + ":" + getFormatedMinutes(time.getMinutes());
  } else {
    return null;
  }
}

function getFormatedMinutes(minutes) {
  let unformatedString = '' + minutes;
  if (unformatedString.length === 1) {
    return '0' + unformatedString;
  } else {
    return unformatedString;
  }
}

function giveDepartures(cb) {
  var stops = [900190001, 900190010, 900015101, 900014102];

  let promises = stops.map(stop => vbb.departures(stop, {
    duration: 5
  }));
  Promise.all(promises).then(arrays => {
    let allLines = [];
    arrays.forEach(arr => allLines = allLines.concat(arr));
    cb(allLines);
  });
}
// giveDepartures(lookIntoVBB);



function lookIntoVBB(data) {
  let slimMessages = data.map(vbbSerializer);
  console.log("________________ALL_____________");
  console.log(slimMessages);
  console.log("______________DELAYS__________");
  let delays = slimMessages.filter(relevantLine).filter(massiveDelay);
  console.log(delays);
}

function vbbSerializer(message) {
  let slimMessage = {
    stationName: message.station.name,
    product: message.line.product,
    lineName: message.line.name,
    direction: message.direction,
    departureTime: message.when,
    delayInMinutes: message.delay / 60
  };
  return slimMessage;
}


function massiveDelay(message) {
  if (message.delayInMinutes >= criticalDelayTime) {
    return true;
  }
}

function relevantLine(message) {
  if(message.stationName === "S Treptower Park" && (message.lineName === "S41" || message.lineName === "S42" || message.lineName === "S8" || message.lineName === "S9"))
    return true;
  else if(message.stationName === "Lohmühlenstr." && message.lineName === "194" && message.direction === "U Hermannplatz")
    return true;
  else if(message.stationName === "U Schlesisches Tor" && message.product === "subway")
    return true;
  else if(message.stationName === "Heckmannufer")
    return true;
  else
    return false;
}




//walking times:
//Treptower Park: 15 Minuten
//Lohmühlenstraße: 3 Minuten
//Heckmannufer: 5 Minuten
//Schlesisches Tor: 13 Minuten

//Treptower Park: 900190001 (S41;S42;S8;S9)
//Lohmühlenstr.: 900190010
//Heckmannufer: 900015101
//Schlesisches Tor: 900014102
