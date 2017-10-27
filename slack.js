const Slack = require('slack-node');
require('dotenv').config();

apiToken = process.env.SLACK_TOKEN;
 
slack = new Slack(apiToken);

module.exports = {
    getUser:(user_id, callback)=>{
        slack.api('users.profile.get', {
            user:user_id,
        }, function(err, response){
        callback(response);
        });
    },
    getEmojies:(callback)=>{
        slack.api('emoji.list',{

        },(err,response)=>{
            if(err){
                console.log(err);
            }else{
                callback(response);
            }
        });
    },
};