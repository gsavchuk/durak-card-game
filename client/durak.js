const	EVENTS = {
	RCV_CARDS: 'receive cards',
	ROUND: 'round',
	MOVE: 'move',
	PICK_UP: 'pick up',
	PASS: 'pass',
	MSG: 'message'
};

const Card = React.createClass({
	render: function() {
		const p = this.props,
					text = p.rank + p.suit;
    return (
			<li className="card" draggable={true} onDragStart={this.dragStart} >
				<div className="rank_corner">{text}</div>
				<div className="rank_center">{text}</div>
      </li>
    );
  },

	dragStart: function(e) {
		e.dataTransfer.setData('application/json', JSON.stringify(this.props));
		e.dataTransfer.effectAllowed = 'move';
	}
});

const CardList = React.createClass({
	render: function() {
		const cards = this.props.cards.map((c) => {
			return (
				<Card key={c.rank+c.suit} rank={c.rank} suit={c.suit} />
			);
		});
		return (
			<ul id={this.props.id} >{cards}</ul>
		);
	}
});

const PlayTable = React.createClass({
	render: function() {
		return (
			<div id="playing_table" onDragOver={this.dragOver} onDrop={this.drop} >
				<CardList id='attack_cards' cards={this.props.attackCards} />
				<CardList id='defend_cards' cards={this.props.defendCards} />
			</div>
		)
	},

	dragOver: function(e) {
		e.preventDefault();
	},

	drop: function(e) {
		const movedCard = JSON.parse(e.dataTransfer.getData('application/json'));
		this.props.makeMove(movedCard);
	}
});

const LogSection = React.createClass({
	render: function() {
		const msgs = this.props.messages.map((msg) => {
			return <li>msg</li>
		})
		return (
			<ul>{msgs}</ul>
		)
	}
});

const MainScreen = React.createClass({
	getInitialState: function() {
		return {
			cards: [],
			attackCards: [],
			defendCards: [],
			messages: [],
			isMyTurn: false, // Has the current player right for first move?
			isAttacker: false // Does the current player attack or defend?
		};
	},

	render: function() {
		return (
			<div>
				<CardList cards={this.state.cards} />
				<PlayTable attackCards={this.state.attackCards}
									 defendCards={this.state.defendCards}
									 makeMove={this.makeMove} />
				<LogSection messages={this.state.messages} />
			</div>
		)
	},
	
	componentWillMount: function() {
		eventSource.addEventListener(EVENTS.RCV_CARDS, (evt) => {
			var cards = this.state.cards;
			cards = cards.concat(JSON.parse(evt.data));
			this.setState({cards: cards});
		});
		eventSource.addEventListener(EVENTS.MOVE, (evt) => {
			const data = JSON.parse(evt.data);
			this.putCardOntoTable(data.card, data.isAttack);
		});
	},

	makeMove: function(card) {
		this.removeCardFromPlayer(card);
		this.putCardOntoTable(card, this.state.isAttacker);
		const evt = {
			card: card,
			isAttack: this.state.isAttacker
		}
		this.notifyServer(EVENTS.MOVE, evt);
	},

	removeCardFromPlayer: function(card) {
		const cards = this.state.cards,
					idx = cards.findIndex((c) => { // card
						return (c.rank === card.rank) && (c.suit === card.suit)
					});
		if (idx === -1) throw "cannot find card " + card
		cards.splice(idx, 1);
		this.setState({cards: cards});
	},

	putCardOntoTable: function(card, isAttack) {
		if (isAttack) {
			const ac = this.state.attackCards;
			ac.push(card);
			this.setState({attackCards: ac})
		} else {
			const dc = this.state.defendCards;
			dc.push(card);
			this.setState({defendCards: dc})
		}
	},

	notifyServer: function(event, data) {
		const req = new XMLHttpRequest();
		req.open('POST', '/client-events', true);
		req.setRequestHeader('Content-Type', 'application/json');
		const evt = {
			type: event,
			game: 'Test game',
			nick: nickname,
			data: data
		}
		req.send(JSON.stringify(evt));
	}
});

//TODO: global state to refactor
var eventSource,
		nickname;

const JoinScreen = React.createClass({
	render: function() {
		return (
			<div>
				<p>Join a game <em>Test game</em> for <em>3</em> players</p>
				<form>
					<label htmlFor="nickname">Nickname</label>
					<input id="nickname" placeholder="John Doe"></input>
					<button type="submit" id="join_button" onClick={this.handleJoin}>Join</button>
				</form>
			</div>
		)
	},

	handleJoin: function() {
		nickname = document.getElementById('nickname').value;
		const url = '/server-events?nick=' + encodeURIComponent(nickname);
		eventSource = new EventSource(url);
		eventSource.onopen = () => {
			this.props.history.push('/game'); // navigate to /game on successful connection
		};
	}
});

const cardsOnHands = ReactDOM.render(
	<ReactRouter.Router>
    <ReactRouter.Route path="/" component={JoinScreen} />
    <ReactRouter.Route path="/game" component={MainScreen} />
  </ReactRouter.Router>,
	document.getElementById('container')
);
