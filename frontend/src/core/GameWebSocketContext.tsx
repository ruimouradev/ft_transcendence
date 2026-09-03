import { createContext, useContext } from 'react';
import type { GameContextType } from './types.ts'

export const GameContext = createContext<GameContextType | null>(null);

export function useGameContext() 
{
	const context = useContext(GameContext);

	if (!context)
		throw new Error('Illegal try to acces getGameContext');
	return (context);
}
