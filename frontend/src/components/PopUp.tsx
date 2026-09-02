import { Box, Modal } from '@mui/material';
import { getPopUpContext } from '../core/GamePopUps';
import ErrorPopUp from '../components/ErrorPopUp';
import SevenPopUp from './SevenPopUp';
import GameEndPopUp from '../components/GameEndPopUp';
import WildCardPopUp from '../components/WildCardPopUp';

function PopUp()
{
	const { popUp } = getPopUpContext();

	if (popUp === 'disabled')
		return null;

	console.log(popUp);
	return (
		<Modal open={true} >
			<Box className="no-select" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				{popUp === 'wildcard' && <WildCardPopUp />}
				{popUp === 'seven' && <SevenPopUp />}
				{popUp === 'game_end' && <GameEndPopUp />}
				{popUp === 'error' && <ErrorPopUp />}
			</Box>
		</Modal>
	)
}

export default PopUp