import { createContext, useContext, useState } from 'react'

export type PopUpTypes = 'wildcard' | 'seven' | 'game_end' | 'error' | 'disabled'

type PopUpBackup = {
	popUp: PopUpTypes,
	identifierID: string | null,
}

type PopUpContextType = {
	popUp: PopUpTypes,
	identifierID: string | null,
	errorMessage: string | null,

	handleGameEnd: () => void,
	handleNewID: (type: PopUpTypes, new_id: string) => void,
	handleNewError: (new_error: string) => void,
	resetPopUpStates: ()  => void,
}

const PopUpContext = createContext<PopUpContextType | null>(null);

export function getPopUpContext()
{
	const context = useContext(PopUpContext);

	if (!context)
		throw new Error('Illegal try to acces getPopUpContext');
	return (context);
}

function GamePopUps({ children }: { children: React.ReactNode })
{
	const [popUp, setPopUp] = useState<PopUpTypes>('disabled');
	const [identifierID, setIdentifierID] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [popUpBackup, setPopUpBackup] = useState<PopUpBackup>({popUp: 'disabled', identifierID: null});

	function handleGameEnd()
	{
		setPopUp('game_end');
	}

	function handleNewID(type: PopUpTypes, new_id: string)
	{
		setIdentifierID(new_id);
		setPopUp(type);
	}

	function handleNewError(new_error: string)
	{
		if (popUp !== 'disabled' && popUp !== 'error')
		{
			setPopUpBackup({popUp: popUp, identifierID: identifierID})
		}
		setErrorMessage(new_error);
		setPopUp('error');
	}
	
	function resetPopUpStates()
	{
		if (popUpBackup.popUp !== 'disabled')
		{
			setPopUp(popUpBackup.popUp);
			setIdentifierID(popUpBackup.identifierID);
			setErrorMessage(null);
			setPopUpBackup({popUp: 'disabled', identifierID: null});
			return ;
		}
		setPopUp('disabled');
		setIdentifierID(null);
		setErrorMessage(null);
	}

	return (
		<PopUpContext.Provider value={{ popUp, identifierID, errorMessage, handleGameEnd, handleNewID, handleNewError, resetPopUpStates }}>
			{ children }
		</PopUpContext.Provider>
	)
}

export default GamePopUps