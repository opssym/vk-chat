'use strict';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var moment = require('moment');
var redis = require('redis');
var client = redis.createClient();

var VK = require('vkapi');
var vk = new VK({
  'appID'     : 4684440,
  'appSecret' : 'oRHPwA3Xvv0lWqLvaSfI',
  'mode'      : 'sig',
  'version'   : '5.27',
  'language'  : 'en'
});

app.set('port', process.env.PORT || 3000);

app.engine('html', require('ejs').__express);

var recent_messages = [];

client.lrange("messages", 0, 99, function(err, posts) {
  if (err) console.log(err);
  for (var i = 0; i < posts.length; i++) {
    recent_messages.push(JSON.parse(posts[i]));
  }
});

client.trim("messages", 0, 99)

app.get('/', function(req,res){
  res.render('index.html', {uid: req.query.viewer_id || 0, recent_messages: recent_messages, moment: moment});
})

app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
  socket.on('new message', function(data) {
    client.lpush("messages", JSON.stringify(data));
    recent_messages.push(data);
    if (recent_messages.length > 100) {
      recent_messages.shift();
    }
    socket.broadcast.emit('new message', data);
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//for tests
module.exports = app;
