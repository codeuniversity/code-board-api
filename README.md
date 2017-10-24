# code-board-api
`npm install` to install dependencies
`npm run dev` for dev-server that watches for file changes
# [ngrok](https://ngrok.com/)
zapier cannot send request to your localhost directly, so you have to use ngrok as a tunnel
# .env
You need to create a `.env` file in the root of the directory with the keys (and their values): 
`MONGO_URL` , `GOOGLE_ACCESS_TOKEN` , `GOOGLE_REFRESH_TOKEN` [look into this for the last two](https://stackoverflow.com/questions/33829108/google-oauth-refresh-token-long-lived-solutions)
, `GOOGLE_CALENDAR_ID` , `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`