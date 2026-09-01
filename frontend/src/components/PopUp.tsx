import { Box, Modal } from '@mui/material';
import { getPopUpContext } from '../core/GamePopUps';
import ErrorPopUp from '../components/ErrorPopUp';
import Seven from '../components/Seven';
import GameEnd from '../components/GameEnd';
import WildCard from '../components/WildCard';

function PopUp()
{
	const { popUp } = getPopUpContext();

	if (popUp === 'disabled')
		return null;

	console.log(popUp);
	return (
		<Modal open={true} >
			<Box className="no-select" sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				{popUp === 'wildcard' && <WildCard />}
				{popUp === 'seven' && <Seven />}
				{popUp === 'game_end' && <GameEnd />}
				{popUp === 'error' && <ErrorPopUp />}
			</Box>
		</Modal>
	)
}

export default PopUp