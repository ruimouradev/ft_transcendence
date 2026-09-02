export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'wild'
export type valueNum = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export type valueAction = '+2' | 'reverse' | 'skip'
export type valueWild = '+4' | 'wild'

export type GameCard = {
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

export type PublicPlayer = {
	id: string,
	name: string,
	cards: number,
	connected: boolean,
	uno: boolean,
	bot: boolean,
	bot_level: 'easy' | 'medium' | 'hard' | null
	avatar: string,
	points: number
}

export type PrivatePlayer = {
	id: string,
	hand: GameCard[],
	playable: string[],
	drawn: string | null
}

export type LastAction = {
	player: string,
    kind: 'join' | 'start' | 'play' | 'draw' | 'pass' 
			| 'catch' | 'challenge' | 'timeout' | 'uno',
    card: GameCard | null,
}

export type GameState = {
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

export type Room = {
	code: string,
	host: string,
	max_players: number,
	players: string[],
	settings: {
		hand_size: number,
		max_players: number,
		public: boolean,
		seven_zero: boolean,
		stacking: boolean,
	}
}

export type Notice = {
	kind: 'emote' | 'uno' | 'catch',
	sender: string,
	icon: number
}