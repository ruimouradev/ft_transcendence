import { Box, Button, Card, CardMedia, Container, Typography } from '@mui/material'
import { useState, useEffect, Fragment } from 'react'

import { Navigate } from 'react-router';
import GameRoom from './GameRoom'
import Lobby from './Lobby'

import { useAuth } from '../core/AuthContext';

import { getGameContext } from '../core/GameWebSocket'

function Play()
{
	const {user} = useAuth();
	const { connected } = getGameContext();
	const { joinRoom } = getGameContext();
	
	useEffect(() => {
		const room = sessionStorage.getItem('roomID');
		const message = {"type": "join", "name": user?.nick_name};
		// const token = sessionStorage.getItem('reconnectToken');

		if (room !== null)
			joinRoom(room, message);
	}, []);

	// if player in room, connect to room
	return (connected === 'online' ? <GameRoom /> : <Lobby />);
}

export default Play