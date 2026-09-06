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
	points: number,
	ready: boolean
}

export type PrivatePlayer = {
	id: string,
	hand: GameCard[],
	playable: string[],
	drawn: string | null
}

export type LastAction = {
	player: string,
    kind: 'join' | 'start' | 'play' | 'draw' 
		| 'catch' | 'challenge' | 'timeout' | 'uno',
    card: GameCard | null,
	target: string | null,
	count: number | null
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

export type FriendEntry = {
    id: string;
    nick_name: string;
    handle: string;
    avatar: string | null;
    status: string | null;
    online?: boolean;
    level: number;
    title: string;
}


// PopUp Types
export type PopUpTypes = 'wildcard' | 'seven' | 'game_end' | 'error' | 'plus4' | 'disabled'

export type PopUpBackup = {
	popUp: PopUpTypes,
	identifierID: string | null,
}

export type PopUpContextType = {
	popUp: PopUpTypes,
	identifierID: string | null,
	errorMessage: string | null,

	handleGameEnd: () => void,
	handleNewID: (type: PopUpTypes, new_id: string) => void,
	handleNewError: (new_error: string) => void,
	resetPopUpStates: ()  => void,
}


// GameWebsocket Context
export type GameContextType = {
	roomID: string | null,
	connected: boolean,
	gameState: GameState | null,
	notices: Notices,

	leaveRoom: () => void,
	resetGameState: () => void,
	getWinnerName: () => string,
	closeRoomConnection: () => void,
	resetNotices: (id: string) => void,
	sendMessage: (message: object) => void,
	joinRoom: (roomID: string, message: object) => void
}

export type Notice = {
	kind: 'emote' | 'uno' | 'catch',
	sender: string,
	icon: number
}

export type Notices = {
	[id: string]: Notice;
}


// AuthContext
export type User = {
  id: string;
  email: string;
  nick_name: string;
  avatar: string;
  card_back: string | null;
  use2fa: boolean
}

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  login: (userData: User) => void;
}

export type NotificationSeverity = 'success' | 'error' | 'info' | 'warning';

export type NotificationSnackbarProps = {
    open: boolean;
    message: string;
    severity: NotificationSeverity;
    onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void;
    autoHideDuration?: number;
}

export type NotificationItem = {
  id: string;
  message: string;
  severity: NotificationSeverity;
}


// DashBoard
export type PlayerData = {
    user: {
        id: string;
        email: string;
        nick_name: string;
        avatar: string;
    };
    total_games: number;
    wins: number;
    losses: number;
    total_score: number;
    level_info: {
        current_level: number;
        total_xp: number;
        xp_in_current_level: number;
        xp_required_for_next_level: number;
        progress_percentage: number;
        total_xp_for_next_level: number;
        title: string;
    };
}

export type MatchRecord = {
    game_id: string;
    is_winner: boolean;
    score: number;
    finished_at: string;
    opponents: string;
}

export type BadgeKind = 'wins' | 'games' | 'score' | 'level';


export type CardBackSelectorProps = {
    cardBacks: string[];
    value: string;
    onChange: (cardBack: string) => void;
    cardWidth?: number;
    cardHeight?: number;
    optionWidth?: number;
    columns?: number;
}


// Leaderboard
export type LeaderboardRow = {
    rank: number;
    user_id: string;
    nick_name: string;
    level: number;
    total_wins: number;
    win_rate: number;
}

export type LeaderboardTableProps = {
    // texto simples ou um nó (as tabs do ecrã das estatísticas)
    title: React.ReactNode;
    rows: LeaderboardRow[];
    currentUserId: string;
    currentUserAvatar: string;
    tag?: string;
}


// API
export type ApiKeyStatus = {
  has_api_key: boolean;
  client_id?: string;
}

export type ApiKeyResponse = {
  api_key: string;
  client_id: string;
}


// Signup
export type  ValidationError = {
    loc: (string | number)[];
    msg: string;
    type: string;
    input?: unknown;
}


// 2FA
export type Enable2FADialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onClosed?: () => void;
}

export type Verify2FAResponse = {
    recovery_codes: string[];
}

export type Reset2FADialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export type Disable2FADialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onClosed?: () => void;
}

export type Setup2FAResponse = {
    otpauth_url: string;
    secret: string;
}

export type Message = {
    code: string;
    status_code: string;
    message: string;
}


// Profile
export type NotificationState = {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
};
