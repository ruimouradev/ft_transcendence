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
	playable: GameCard[],
	drawn: string | null
}

type GameState = {
	type : 'state',
	seq : number,
	phase : "lobby" | "playing" | "finished",
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
	top_card : null,
	active_color : Color | null,
	direction : 1 | -1,
	turn : string | null,
	draw_pile : number,
	stack : number,
	plus4_by : string | null,
	last_action : null,
	winner : string | null,
	winner_score : string | null
}

const you: PrivatePlayer = {

}

const players: PublicPlayer[] = {


}


export const gameState: GameState = {
	type : 'state',
	seq : 20,
	phase : 'playing',
	you : you,
	players : players,
	host_id : 'p0',
	settings : {
		hand_size: 7, 
		stacking: false, 
		seven_zero: false,
		max_players: 4,
		public: true
	}
	top_card : null,
	active_color : Color | null,
	direction : 1 | -1,
	turn : string | null,
	draw_pile : number,
	stack : number,
	plus4_by : string | null,
	last_action : null,
	winner : string | null,
	winner_score : string | null
}