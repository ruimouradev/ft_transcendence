import Section from './Section';
import {Box, Typography } from '@mui/material';

function Terms() {
    return (
        <Box sx={{ maxWidth: '48rem', mx: 'auto', px: 3, py: 6 }}>
            <Typography component="h1" sx={{ fontSize: '1.8rem', lineHeight: '2.5rem', fontWeight: 900, color: 'white', mb: 1 }}>Terms of Service</Typography>
            <Typography sx={{ color: '#999999', fontSize: '14px', lineHeight: 1.4, mb : 5 }}>Last updated: August 21, 2026</Typography>

            <Section title="What this is">
                <Typography>
                    This site is a free, non commercial student project built at
                    42 Lisboa. By creating an account or playing here you agree to
                    these terms. UNO is a trademark of its respective owner; this
                    project is not affiliated with or endorsed by it.
                </Typography>
            </Section>

            <Section title="Your account">
                <ul className="legal">
                    <li>Use a real email address you control, it is needed to
                        activate the account.</li>
                    <li>Keep your password to yourself. What happens in your
                        account is your responsibility.</li>
                    <li>Pick a nickname and an avatar that are not offensive and
                        do not pretend to be someone else.</li>
                </ul>
            </Section>

            <Section title="Fair play">
                <ul className="legal">
                    <li>Play the game yourself. Automating your moves or using a
                        second account to gain an advantage is not allowed.</li>
                    <li>Do not exploit bugs. If you find one, tell the team
                        instead.</li>
                    <li>Be decent to the other players.</li>
                </ul>
                <Typography>
                    Accounts that break these rules can be suspended or removed.
                </Typography>
            </Section>

            <Section title="Availability and your data">
                <Typography>
                    This is an educational project offered as is: we do our best to
                    keep it running, but there is no guarantee of availability, and
                    game data may be reset during development. You can ask for your
                    account to be deleted at any time, as described in the Privacy
                    Policy.
                </Typography>
            </Section>

            <Section title="Changes">
                <Typography>
                    If these terms change, the date at the top of this page changes
                    with it. Playing after a change means you accept the new terms.
                </Typography>
            </Section>
        </Box>
    );
}

export default Terms