import back00 from '../assets/cardbacks/back_card_00.png';
import back01 from '../assets/cardbacks/back_card_01.png';
import back02 from '../assets/cardbacks/back_card_02.png';
import back03 from '../assets/cardbacks/back_card_03.png';
import back04 from '../assets/cardbacks/back_card_04.png';

import arrow_01 from '../assets/utils/arrow_01.png';
import arrow_02 from '../assets/utils/arrow_02.png';
import bg from '../assets/utils/game_bg.png';

// A tabela dos versos de carta. Na base de dados guarda-se o nome de
// código (back00, back01...), nunca o caminho do ficheiro: caminhos
// mudam quando um ficheiro é renomeado e mudam sempre na build de
// produção, os nomes de código sobrevivem a tudo. Quem mexer nas
// imagens só precisa de atualizar esta tabela.
export const cardBacks: Record<string, string> = {
    back00,
    back01,
    back02,
    back03,
    back04,
};

// O verso usado quando a conta tem um valor antigo ou desconhecido
export const defaultCardBack = back00;

export const direction_plus = arrow_01;
export const direction_minus = arrow_02;
export const bg_image = bg;