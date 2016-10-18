const express = require('express'),
			bodyParser = require('body-parser'),
			game = require('./server/game.js'),
			app = express();

app.use(express.static('client'));
app.use(bodyParser.json());

app.get('/server-events', (req, res) => {
	// req.socket.setKeepAlive(true, 10 * 1000); //10 sec keepalive probes
	req.socket.setTimeout(0);
	req.on('close', () => {
		console.log('event stream closed' + new Date());
	});
	res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
	res.write('\n');
	game.joinPlayer('Test game', req.query.nick, res);
});

app.post('/client-events', (req, res) => {
	const body = req.body,
				evt = body.type,
				events = game.EVENTS;
	if (evt === events.MOVE) {
		game.move(body.game, body.nick, body.data);
	}
});

app.listen(8080, () => {
	console.log('listening on port 8080');
});
