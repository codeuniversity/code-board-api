require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const urlmongodb = process.env.MONGO_URL;

MongoClient.connect(urlmongodb, function (err, db) {
    db.dropCollection('slack').then((result)=>{
        console.log('dropped Slack');
        console.log(result);
    });
    db.close();
});    