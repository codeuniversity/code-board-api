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
    let keys=Object.keys(req);
    console.log(req.body);
    res.send({});
    temp=req.body;
  });
app.get('/',(req,res)=>{
    console.log("/");
    res.send(temp);
});
app.post('/slack',(req,res)=>{
    temp=req.body;
    console.log("-----SLACK-------");
    console.log(req.body);
    res.send({});
    io.emit("slack_message",{text:req.body.text});
}); 
io.on("connection",(socket)=>{
    console.log("client connected");
    socket.on("disconnect",()=>{
        console.log("client disconnected");
    });
});