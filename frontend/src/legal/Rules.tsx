import Section from './Section';
import {Box, Typography } from '@mui/material';

function Rules() {
    return (
        <Box sx={{ maxWidth: '48rem', mx: 'auto', px: 3, py: 6 }}>
            <Typography component="h1" sx={{ fontSize: '1.8rem', lineHeight: '2.5rem', fontWeight: 900, color: 'white', mb: 1 }}>Game Rules</Typography>
            <Typography sx={{ color: '#999999', fontSize: '14px', lineHeight: 1.4, mb : 5 }}>
                The official UNO rules our engine follows, plus the house
                rules and the bots you can add when you create a room.
            </Typography>

            <Section title="The goal">
                <Typography>
                    Be the first to play every card in your hand. The winner
                    scores the cards still left in the other hands, numbers
                    at face value, the action cards 20 each, and the wilds
                    50 each, so the fewer cards everyone else has, the more
                    you score.
                </Typography>
            </Section>

            <Section title="Playing a card">
                <Typography>
                    On your turn you play one card that matches the card on
                    top of the pile, by color or by number or symbol. A wild
                    card can be played on anything, and you choose the color
                    that carries on.
                </Typography>
                <Typography>
                    If you have no card that matches, you draw one from the
                    deck. If the card you drew can be played you must play
                    it, otherwise your turn passes to the next player.
                </Typography>
            </Section>

            <Section title="The action cards">
                <ul className="legal">
                    <li><b>+2</b>: the next player draws two cards and loses
                        their turn.</li>
                    <li><b>Skip</b>: the next player loses their turn.</li>
                    <li><b>Reverse</b>: play changes direction. With only two
                        players it works as a skip.</li>
                    <li><b>Wild</b>: you choose the color that carries on.</li>
                    <li><b>Wild +4</b>: you choose the color, and the next
                        player draws four and loses their turn. You may only
                        play it when you have no card of the current color.</li>
                </ul>
            </Section>

            <Section title="Challenging a +4">
                <Typography>
                    A +4 is only allowed when you hold no card of the color
                    in play. If the player before you plays one, you may
                    either draw the four, or challenge it. If the challenge
                    is right, they were bluffing and draw the four
                    themselves. If it is wrong, you draw six instead, the
                    four plus two for doubting.
                </Typography>
            </Section>

            <Section title="Saying UNO">
                <Typography>
                    When a play leaves you with a single card you must say
                    UNO. If you forget, any other player can catch you and
                    you draw two cards as a penalty. Say it in time and you
                    are safe.
                </Typography>
            </Section>

            <Section title="Playing against bots">
                <Typography>
                    You do not need a full table of people. The host can fill
                    any free seat with an AI opponent, at three difficulties,
                    easy, medium and hard. You can play alone against bots or
                    mix them with other players, and they follow the same
                    rules as everyone else.
                </Typography>
            </Section>

            <Section title="House rules">
                <Typography>
                    When you create a room you can turn these on. The
                    defaults are the plain official game.
                </Typography>
                <ul className="legal">
                    <li><b>Hand size</b>: how many cards everyone starts with,
                        from three to ten. The default is seven.</li>
                    <li><b>Stacking</b>: a +2 can be answered with another +2,
                        and the pile grows until someone cannot answer and
                        draws the whole lot.</li>
                    <li><b>Seven-zero</b>: playing a seven swaps your hand with
                        a player you choose, and playing a zero rotates every
                        hand in the direction of play.</li>
                    <li><b>Table size</b>: from two to four seats, humans and
                        bots together.</li>
                    <li><b>Public or private</b>: a public room shows up in the
                        room list, a private one is reached only by its code.</li>
                </ul>
            </Section>
        </Box>
    );
}

export default Rules