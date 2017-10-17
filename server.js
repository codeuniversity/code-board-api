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
app.post('/calendar',(req, res)=>{
    console.log(req.body);
    res.send({});
    temp=req.body;
  });
app.get('/',(req,res)=>{
    console.log("/");
    res.send(temp);
});

let messages = []; // <- temporary, shoudl be a db

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
    messages.push(slimMessage);
    io.emit("slack_message",slimMessage);
}); 
io.on("connection",(socket)=>{
    socket.emit("all_messages",messages); // <- REALLY temporary
    console.log("client connected");
    socket.on("disconnect",()=>{
        console.log("client disconnected");
    });
});