import { createContext, useContext } from 'react'
import type { PopUpContextType } from  './types.ts'

export const PopUpContext = createContext<PopUpContextType | null>(null);

export function usePopUpContext()
{
	const context = useContext(PopUpContext);

	if (!context)
		throw new Error('Illegal try to acces getPopUpContext');
	return (context);
}