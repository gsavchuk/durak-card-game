const _ = require('underscore');

const SUITS = ["♥", "♦", "♣", "♠"],
      RANKS = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"],
			GAMES = {
				'Test game': {
					numOfPlayers: 4,
					players: []
				}
			},
			CARDS_PER_PLAYER = 6,
			EVENTS = {
				RCV_CARDS: 'receive cards',
				ROUND: 'round',
				MOVE: 'move',
				PICK_UP: 'pick up',
				PASS: 'pass',
				MSG: 'message'
			};

function joinPlayer(gameName, playerNick, connection) {
	const game = GAMES[gameName];
	if (game === undefined) {
		throw `The game named "${name}" doesn't exist.`
	}
	const	players = game.players,
				player = {
					nick: playerNick,
					conn: connection,
					cards: []
				};
	players.push(player);
	if (players.length === game.numOfPlayers) {
		game.deck = shuffleArray(makeDeck());
		deal(game);
	}
}

function makeDeck() {
  var deck = [];
  for (var i of SUITS) {
    for (var j of RANKS) {
      deck.push({
				rank: j,
				suit: i
			});
    }
  }
  return deck;
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}

function deal(game) {
	const players = game.players,
				deck = game.deck;
	players.forEach((p) => {
		if (!deck.length) return; // there is nothing to deal
		var toDeal = CARDS_PER_PLAYER - p.cards.length;
		if (toDeal > deck.length) toDeal = deck.length;
		const dealed = game.deck.splice(-toDeal, toDeal);
		p.cards = p.cards.concat(dealed);
		sendEvent(p.conn, EVENTS.RCV_CARDS, dealed);
	});
}

function sendEvent(conn, event, data) {
	conn.write('event: ' + event + '\n');
	conn.write('data: ' + JSON.stringify(data) + '\n\n');
}

function move(gameName, playerNick, data) {
	const game = GAMES[gameName];
	if (game === undefined) {
		throw `The game named "${name}" doesn't exist.`
	}
	const	players = game.players,
				currPlayer = players.find((pl) => {
					return pl.nick === playerNick;
				});
	if (!currPlayer) throw 'cannot find player ' + playerNick;
	const card = data.card,
				idx = currPlayer.cards.findIndex((c) => {
					return (c.rank === card.rank) && (c.suit === card.suit);
				});
	if (idx === -1) throw 'cannot find card ' + card;
	currPlayer.cards.splice(idx, 1);
	const remainingPlayers = players.filter((pl) => {
					return pl.nick !== playerNick;
				});
	remainingPlayers.forEach((p) => {
		sendEvent(p.conn, EVENTS.MOVE, data);
	});
}

exports.EVENTS = EVENTS;
exports.joinPlayer = joinPlayer;
exports.move = move;
