type Color = 'red' | 'blue' | 'green' | 'yellow' | 'wild'
type valueNum = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
type valueAction = '+2' | 'reverse' | 'skip'
type valueWild = '+4' | 'wild'

type GameCard = {
		id: string,
		color: Color,
		value: valueNum
	} | {
		id: string,
		color: Color,
		value: valueAction
	} | {
		id: string,
		color: 'wild'
		value: valueWild
	}

type PublicPlayer = {
	id: string,
	name: string,
	cards: number,
	connected: boolean,
	uno: boolean,
	bot: boolean,
	avatar: string,
	points: number
}

type PrivatePlayer = {
	id: string,
	hand: GameCard[],
	playable: string[],
	drawn: string | null
}

type GameState = {
	type : 'state',
	seq : number,
	phase : 'lobby' | 'playing' | 'finished',
	you : PrivatePlayer,
	players : PublicPlayer[],
	host_id : string | null,
	settings : {
		hand_size: number, 
		stacking: boolean, 
		seven_zero: boolean,
		max_players: number,
		public: boolean
	} | null,
	top_card : GameCard | null,
	active_color : Color | null,
	direction : 1 | -1,
	turn : string | null,
	draw_pile : number,
	stack : number,
	plus4_by : string | null,
	last_action : LastAction | null,
	winner : string | null,
	winner_score : number | null
}

type LastAction = {
	player: string,
    kind: 'join' | 'start' | 'play' | 'draw' | 'pass' 
			| 'catch' | 'challenge' | 'timeout' | 'uno',
    card: GameCard | null,
}

export const hand: GameCard[] = [
{id: 'c99', color: 'yellow', value: '3'},
{id: 'c106', color: 'green', value: '7'},
{id: 'c101', color: 'red', value: '9'},	
{id: 'c104', color: 'red', value: 'reverse'},
{id: 'c111', color: 'wild', value: 'wild'},
{id: 'c108', color: 'blue', value: '3'},
{id: 'c116', color: 'yellow', value: '7'},
{id: 'c105', color: 'green', value: '3'},
{id: 'c100', color: 'red', value: '0'}]

export const you: PrivatePlayer = {
	id: 'p1',
	hand: hand,
	playable: ["c107", "c104"],
	drawn: null,
}

export const players: PublicPlayer[] = [
{id: 'p1', name: 'Viniciussss', cards: 16, connected: true, uno: false, bot: false, avatar: '/static/a7eae121b02841b1837cd57b060a7869/avatar.png', points: 0},
{id: 'p2', name: 'Maria João', cards: 7, connected: true, uno: false, bot: false, avatar: '/static/a7eae121b02841b1837cd57b060a7869/avatar.png', points: 0},
{id: 'p3', name: 'Joana', cards: 7, connected: true, uno: false, bot: false, avatar: '/static/a7eae121b02841b1837cd57b060a7869/avatar.png', points: 0},
{id: 'p4', name: 'Ana', cards: 10, connected: true, uno: false, bot: false, avatar: '/static/a7eae121b02841b1837cd57b060a7869/avatar.png', points: 0}]

export const fakeState: GameState = {
	type : 'state',
	seq : 42,
	phase : 'playing',
	you : you,
	players : players,
	host_id : 'p1',
	settings : {
		hand_size: 7, 
		stacking: false, 
		seven_zero: false,
		max_players: 4,
		public: true
	},
	top_card: {color: "blue", id: "c79", value: "1"},
	active_color : 'blue',
	direction : 1,
	turn : 'p1',
	draw_pile : 79,
	stack : 0,
	plus4_by : null,
	last_action : {player: 'p1', kind: 'start', card: null},
	winner : null,
	winner_score : null
}