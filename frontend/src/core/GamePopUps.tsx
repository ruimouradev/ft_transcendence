import { useCallback, useState } from 'react'
import { PopUpContext } from './GamePopUpsContext'
import type { PopUpTypes, PopUpBackup } from  './types.ts'

function GamePopUps({ children }: { children: React.ReactNode })
{
	const [popUp, setPopUp] = useState<PopUpTypes>('disabled');
	const [identifierID, setIdentifierID] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [popUpBackup, setPopUpBackup] = useState<PopUpBackup>({popUp: 'disabled', identifierID: null});

	const handleGameEnd = useCallback(() => {
		setPopUp('game_end');
	}, [])

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
	
	// function resetPopUpStates()
	// {
	// 	if (popUpBackup.popUp !== 'disabled')
	// 	{
	// 		setPopUp(popUpBackup.popUp);
	// 		setIdentifierID(popUpBackup.identifierID);
	// 		setErrorMessage(null);
	// 		setPopUpBackup({popUp: 'disabled', identifierID: null});
	// 		return ;
	// 	}
	// 	setPopUp('disabled');
	// 	setIdentifierID(null);
	// 	setErrorMessage(null);
	// }

	// Trying this !!!! Maybe DEL !!!
	const resetPopUpStates = useCallback(() => {
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
	},[popUpBackup])

	return (
		<PopUpContext.Provider value={{ popUp, identifierID, errorMessage, handleGameEnd, handleNewID, handleNewError, resetPopUpStates }}>
			{ children }
		</PopUpContext.Provider>
	)
}

export default GamePopUps