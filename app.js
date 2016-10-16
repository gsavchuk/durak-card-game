var express = require('express'),
    game = require('./server/game.js');
var app = express();

app.use(express.static('client'));

app.listen(8080, function () {
    console.log('listening on port 8080');
});
