import { Box, Button, Card, CardMedia, Container, Typography } from '@mui/material'
import { useState, useEffect, Fragment } from 'react'

import { Navigate } from 'react-router';
import GameRoom from './GameRoom'
import Lobby from './Lobby'

import { useAuth } from '../core/AuthContext';

import { getGameContext } from '../core/GameWebSocket'

function Play()
{
	const { connected } = getGameContext();

	// const { gameState } = getGameContext();
	// console.log(gameState);

	const room = sessionStorage.getItem('roomID');
	const token = sessionStorage.getItem('reconnectToken');

	console.log(room);
	console.log(token);

	const {user} = useAuth();

	const message = {"type": "join", "name": user?.nick_name};

	const { joinRoom } = getGameContext();

	if (room)
		joinRoom(room, message);

	// if player in room
	// connect to room

	return (connected === 'online' ? <GameRoom /> : <Lobby />);
}

export default Play