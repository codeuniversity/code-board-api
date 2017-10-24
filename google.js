require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const TokenProvider = require('refresh-token').GoogleTokenProvider;
const tokenProvider=new TokenProvider({
  refresh_token:process.env.GOOGLE_REFRESH_TOKEN, 
  client_id:process.env.GOOGLE_CLIENT_ID, 
  client_secret:process.env.GOOGLE_CLIENT_SECRET,
});
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

module.exports = function getEvents(cb) {
  authorize(listEvents, cb);
};
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback, ...rest) {
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2();
  tokenProvider.getToken(function (err, token) {
    oauth2Client.credentials = {
      access_token: token,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      // expiry_date: true,
    };
      callback(oauth2Client,...rest); 
   });
     
}

function listEvents(auth,cb) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    cb(events);
  });
}
