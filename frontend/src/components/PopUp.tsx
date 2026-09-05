import { Box, Modal } from '@mui/material';
import { usePopUpContext } from '../core/GamePopUpsContext';
import ErrorPopUp from '../components/ErrorPopUp';
import SevenPopUp from './SevenPopUp';
import GameEndPopUp from '../components/GameEndPopUp';
import WildCardPopUp from '../components/WildCardPopUp';
import Plus4PopUp from '../components/Plus4PopUp';

function PopUp()
{
	const { popUp } = usePopUpContext();

	if (popUp === 'disabled')
		return null;

	return (
		<Modal open={true} >
			<Box className="no-select" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				{popUp === 'wildcard' && <WildCardPopUp />}
				{popUp === 'seven' && <SevenPopUp />}
				{popUp === 'game_end' && <GameEndPopUp />}
				{popUp === 'error' && <ErrorPopUp />}
				{popUp === 'plus4' && <Plus4PopUp />}
			</Box>
		</Modal>
	)
}

export default PopUp