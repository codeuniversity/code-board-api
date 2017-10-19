const app = require("express")();
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const port = process.env.PORT || 4001;
const bodyParser = require("body-parser");
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);
const io = socketIo(server);

//Connect to Mongoose (MongoDB)
mongoose.connect('mongodb://admin:testmongodb@codeboard-shard-00-00-iqwvb.mongodb.net:27017,codeboard-shard-00-01-iqwvb.mongodb.net:27017,codeboard-shard-00-02-iqwvb.mongodb.net:27017/test?ssl=true&replicaSet=CodeBoard-shard-0&authSource=admin');
var db = mongoose.connection;

//Defining Slack Schema
var slackSchema = mongoose.Schema({
  text:{
    type: String,
    user: {
      name: String,
      profile: {
        first_name: String,
        last_name: String,
        medium_image_url: String,
      }
    }
  }
});

//Compiling slackSchema & Make it accesible
var Slack = mongoose.model('Slack', slackSchema);

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

var saveslack  = new Slack(slimMessage);
saveslack.save(function (err, save) {
  if (err) return console.error(err);
  console.log('+++ slimMessage Saved +++');
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

  });

//Show all saved Messages in Console
Slack.find(function (err, slack){
    if (err) return console.error(err);
    console.log(slack);
});

//Send data to Socket.io
io.on("connection",(socket)=>{
    socket.emit("all_messages",messages); // <- REALLY temporary
    console.log("client connected");
    socket.on("disconnect",()=>{
        console.log("client disconnected");
    });
});
