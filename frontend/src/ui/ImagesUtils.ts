import back00 from '../assets/cardbacks/back_card_00.png';
import back01 from '../assets/cardbacks/back_card_01.png';
import back02 from '../assets/cardbacks/back_card_02.png';
import back03 from '../assets/cardbacks/back_card_03.png';
import back04 from '../assets/cardbacks/back_card_04.png';
import bg from '../assets/utils/game_bg.png';
import red from '../assets/utils/color_red.png';
import blue from '../assets/utils/color_blue.png';
import green from '../assets/utils/color_green.png';
import yellow from '../assets/utils/color_yellow.png';
import winner from '../assets/utils/winner.png';
import arrow_01 from '../assets/utils/arrow_01.png';
import arrow_02 from '../assets/utils/arrow_02.png';
import _catch from '../assets/utils/catch.png';
import uno from '../assets/utils/uno.png';

import sad from '../assets/utils/sad.png';
import angry from '../assets/utils/angry.png';
import happy from '../assets/utils/happy.png';
import excited from '../assets/utils/excited.png';
import nervous from '../assets/utils/nervous.png';
import surprised from '../assets/utils/surprised.png';

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

export const bg_image = bg;
export const winner_image = winner;
export const direction_plus = arrow_01;
export const direction_minus = arrow_02;
export const emoticon_uno = uno;
export const emoticon_catch = _catch;


// Square Colors
export const color_red = red;
export const color_blue = blue;
export const color_green = green;
export const color_yellow = yellow;

// Emoticons
export const emoticon_sad = sad;
export const emoticon_angry = angry;
export const emoticon_happy = happy;
export const emoticon_excited = excited;
export const emoticon_nervous = nervous;
export const emoticon_surprised = surprised;