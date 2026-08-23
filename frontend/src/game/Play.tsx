import { Box, Button, Card, CardMedia, Container, Typography } from '@mui/material'
import { useState, useEffect, Fragment } from 'react'

import { Navigate } from 'react-router';
import GameRoom from './GameRoom'
import Lobby from './Lobby'

import { getGameContext } from '../core/GameWebSocket'

function Play()
{
	const { connected } = getGameContext();

	return (connected === 'online' ? <GameRoom /> : <Lobby />);
}

export default Play