const app = require("express")();
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const port = process.env.PORT || 4001;
const bodyParser = require("body-parser");
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);
const io = socketIo(server);
server.listen(port, () => console.log(`Listening on port ${port}`));
let temp = null;

//Slack API
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
    console.log("-------THIS IS WHERE THE SLACK SLIMMESSAGE IS SUPPOSED TO START-------");
    console.log(slimMessage);
    messages.push(slimMessage);
    io.emit("slack_message",slimMessage);
});

//Calendar API
app.post('/calendar',(req, res)=>{
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

    console.log("-------THIS IS WHERE THE CALENDAR SLIMMESSAGE IS SUPPOSED TO START-------");
    console.log(slimMessage);
    messages.push(slimMessage);
    io.emit("slack_message",slimMessage);

  });

//Test if Node Running & Working
app.get('/',(req,res)=>{
    console.log("/");
    res.send(temp);
});


let messages = []; // <- temporary, should be a db



//Send data vie Socket.io
io.on("connection",(socket)=>{
    socket.emit("all_messages",messages); // <- REALLY temporary
    console.log("client connected");
    socket.on("disconnect",()=>{
        console.log("client disconnected");
    });
});



console.log("Script works");
