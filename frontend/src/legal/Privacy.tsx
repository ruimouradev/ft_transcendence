import Section from './Section';
import {Box, Typography } from '@mui/material';

function Privacy() {
    return (
        <Box sx={{ maxWidth: '48rem', mx: 'auto', px: 3, py: 6 }}>
            <Typography component="h1" sx={{ fontSize: '1.8rem', lineHeight: '2.5rem', fontWeight: 900, color: 'white', mb: 1 }}>Privacy Policy</Typography>
            <Typography sx={{ color: '#999999', fontSize: '14px', lineHeight: 1.4, mb : 5 }}>Last updated: September 03, 2026</Typography>

            <Section title="Who we are">
                <Typography>
                    This site is a non commercial student project built at 42 Lisboa.
                    It lets you play the UNO card game online with friends. This page
                    explains what personal data the site keeps and why.
                </Typography>
            </Section>

            <Section title="What we collect">
                <Typography>When you create an account, we store:</Typography>
                <ul className="legal">
                    <li>Your email address, used to activate and identify the account.</li>
                    <li>Your nickname and, if you upload one, your avatar image.</li>
                    <li>Your password, stored only as a secure hash, never in plain text.</li>
					<li>If 2FA is used, the secret is stored so the codes can be checked, and the recovery codes are saved as a secure hash.</li>
					<li>If an API key is created, only a secure hash of the key is saved.</li>
					<li>If 42 login is used, the ID, email, login and profile picture provided by 42 are saved, along with the 42 access token.</li>
                </ul>
                <Typography>While you use the site, we also store:</Typography>
                <ul className="legal">
                    <li>Your friends list and friend requests.</li>
                    <li>The results of your finished games: wins, losses and scores,
                        used for your statistics and the leaderboards.</li>
                    <li>Whether you are online, so your friends can see it.</li>
                </ul>
            </Section>

            <Section title="Signing in with 42">
                <Typography>
                    If you choose to sign in with your 42 account, the 42 intranet
                    shares your email, your login name and your profile picture with
                    us, and we use them to create and fill your account here. We
                    never see your 42 password.
                </Typography>
            </Section>

            <Section title="Cookies">
                <Typography>
                    The site uses a single session cookie so you stay signed in. It
                    expires after 8 days and the browser scripts cannot read it.
                    There are no advertising or tracking cookies.
                </Typography>
            </Section>

            <Section title="How your data is protected">
                <Typography>
                    All the communication with the site travels over HTTPS. Passwords
                    are hashed with a modern algorithm before being stored. Your data
                    lives in our own database and is never sold or shared with third
                    parties.
                </Typography>
            </Section>

            <Section title="Your rights">
                <Typography>
                    You can see and edit your profile data (nickname, avatar,
                    password) at any time from the profile page. If you want your
                    account and its data deleted, contact the team and we will remove
                    it.
                </Typography>
            </Section>

            <Section title="Changes">
                <Typography>
                    If this policy changes, the date at the top of this page changes
                    with it.
                </Typography>
            </Section>
        </Box>
    );
}

export default Privacy