// Ex01
export interface Player {
	id: number,
	nick: string,
	score: number,
	wins: number,
	connected: boolean,
	hand?: Card[],
	handCount: number,
}

// Ex02
export type Color = 'red' | 'blue' | 'green' | 'yellow'
export type valueNum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0
export type valueAction = '+2' | 'rev' | 'skip'
export type valueWild = '+4' | 'color'

export type Card = {
		id: number,
		kind: 'number',
		color: Color,
		value: valueNum
	} | {
		id: number,
		kind: 'action'
		color: Color,
		value: valueAction
	} | {
		id: number,
		kind: 'wildcard'
		value: valueWild
	}

// Ex03
export function generateDeck(): Card[]
{
	let deck: Card[] = [];
	let id_count: number = 1;

	const colorValues: Color[] = ['red', 'blue', 'green', 'yellow'];
	const numValues: valueNum[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	const actionValues: valueAction[] = ['+2', 'rev', 'skip'];
	const wildValues: valueWild[] = ['+4', 'color'];

	for (const values of numValues) {
		if (values !== 0) {
			for (const colors of colorValues)
				deck.push({id: id_count++, kind: 'number', color: colors, value: values})
		}
		for (const colors of colorValues)
			deck.push({id: id_count++, kind: 'number', color: colors, value: values})
	}
	for (const action of actionValues) {
		for (const colors of colorValues) {
				deck.push({id: id_count++, kind: 'action', color: colors, value: action})
			deck.push({id: id_count++, kind: 'action', color: colors, value: action})
		}
	}
	for (const wild of wildValues) {
		for (let i = 0; i < 4; i++) {
			deck.push({id: id_count++, kind: 'wildcard', value: wild})
		}
	}
	return deck
}


// Ex04
export function shuffle(deck: Card[]): Card[]
{
	// Not a real shuffle !!!
	// Do not use for final product
	deck.sort(() => Math.random() - 0.5);
	return (deck);
}


// Ex05
export function addPlayer(players: Player[], p: Player)
{
	players.push(p);
}

export function removePlayer(players: Player[], p: Player)
{
	const index = players.indexOf(p);

	if (index !== -1)
		players.splice(index, 1);
}

export function findPlayer(players: Player[], nick: string): Player | null
{
	for (const p of players) {
		if (p.nick === nick)
			return (p)
	}
	return (null)
}

export function updateScore(p: Player, score: number)
{
	p.score = score;
}


// Ex06
export interface Gamestate {
	players: Player[],
	activePlayer: number,
	discard: Card[],
	deck: Card[],
	top_card?: Card,
	direction: 'left' | 'right'
}

export let gameState: Gamestate = {
	players: [],
	activePlayer: -1,
	discard: [],
	deck: [],
	direction: 'left',
}

gameState.deck = shuffle(shuffle(generateDeck()));
//console.log(gameState.deck);


// Ex07
export function startGame(game: Gamestate)
{
	for (const players of game.players)
		drawCard(game.deck, players, 7);

	// console.log(game.deck);
	// console.log(game.discard);

	// Could be game.top_card = game.deck.splice(0, 1)[0];
	// do
	// {
	// 	game.top_card = game.deck[0];
	// } while(game.top_card.kind === 'wildcard');

	game.top_card = game.deck[0];
	
	game.deck.splice(0, 1);


	// console.log(game.top_card);
	// console.log(game.discard);
	// console.log(game.deck);

	// console.log();
	// for (const players of game.players)
	// {
	// 	console.log(players.nick, "hand:");
	// 	console.log(players.hand);
	// 	console.log();
	// }
}

export function drawCard(deck: Card[], player: Player, amount: number)
{
	const cards: Card[] = deck.splice(0, amount);
	player.hand = player.hand !== undefined ? player.hand.concat(cards) : cards;
	player.handCount += amount;
}

export function playCard(game: Gamestate, card: Card, player: Player)
{
	if (player.hand === undefined)
		return ;
	const index: number = player.hand.indexOf(card);
	if (index !== -1)
		return ;

	if (game.top_card !== undefined)
		game.discard.push(game.top_card);
	game.top_card = player.hand.splice(index, 1)[0];
}

addPlayer(gameState.players, {id: 1, nick: 'jinx', score: 0, wins: 0, connected: true, handCount: 0});
addPlayer(gameState.players, {id: 2, nick: 'chaud', score: 0, wins: 0, connected: true, handCount: 0});
addPlayer(gameState.players, {id: 3, nick: 'rui', score: 0, wins: 0, connected: true, handCount: 0});
addPlayer(gameState.players, {id: 4, nick: 'gui', score: 0, wins: 0, connected: true, handCount: 0});

console.log(gameState.players);
console.log();

startGame(gameState);


// // console.log(gameState.players[1]);
// // drawCard(gameState.deck, gameState.players[1], 7);
// // console.log(gameState.players[1]);

// // Chaud plays a card
// console.log();
// console.log("--- Game Simulation ---\n");

// playCard(gameState, gameState.players[1].hand[2], gameState.players[1]);

// console.log();
// console.log(gameState.players);
// console.log(gameState);
