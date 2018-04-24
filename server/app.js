"use strict";

const HTTP_PORT = 8000;
const DB_URL = 'mongodb://localhost:27017/';

const express = require('express');
const app = express();
const http = require('http').createServer(app);

const path = require('path');
const rfs = require('rotating-file-stream')
const fs = require('fs');
const morgan = require('morgan');

var argv = require('yargs')
  .command('$0 <logDir>', 'default command', (yargs) => {
    yargs.positional('logDir', {
      describe: 'Log directory',
      type: 'string'
    })
  })
  .argv;

(function initLogging() {
  fs.existsSync(argv.logDir) || fs.mkdirSync(argv.logDir);

  // Create a rotating write stream (https://github.com/expressjs/morgan).
  var accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: argv.logDir
  });

  app.use(morgan('combined', {stream: accessLogStream}));
})();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const MongoClient = require('mongodb').MongoClient;

console.log('Starting server...');

MongoClient.connect(DB_URL, (err, client) => {
  if (err) {
    console.log("Fatal error connecting to the MongoDB: " + err.message);
    process.exit(1);
  }

  app.use('/', express.static(path.join(__dirname, 'public')))

  const Api = require('./routes/api');
  app.use('/api', (new Api(client)).router);

  http.listen(HTTP_PORT, () => {
    console.log('OK! Listening on port ' + HTTP_PORT.toString());
  });
});
