import Section from './Section';

// A Privacy Policy: escrita para o que o site realmente guarda e faz.
// Se algum comportamento mudar (dados novos, partilhas novas), esta
// página tem de acompanhar. O texto é teu para ajustar.

function Privacy() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-black text-white mb-2">Privacy Policy</h1>
            <p className="text-gray-400 text-sm mb-10">Last updated: August 21, 2026</p>

            <Section title="Who we are">
                <p>
                    This site is a non commercial student project built at 42 Lisboa.
                    It lets you play the UNO card game online with friends. This page
                    explains what personal data the site keeps and why.
                </p>
            </Section>

            <Section title="What we collect">
                <p>When you create an account, we store:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Your email address, used to activate and identify the account.</li>
                    <li>Your nickname and, if you upload one, your avatar image.</li>
                    <li>Your password, stored only as a secure hash, never in plain text.</li>
                </ul>
                <p>While you use the site, we also store:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Your friends list and friend requests.</li>
                    <li>The results of your finished games: wins, losses and scores,
                        used for your statistics and the leaderboards.</li>
                    <li>Whether you are online, so your friends can see it.</li>
                </ul>
            </Section>

            <Section title="Signing in with 42">
                <p>
                    If you choose to sign in with your 42 account, the 42 intranet
                    shares your email, your login name and your profile picture with
                    us, and we use them to create and fill your account here. We
                    never see your 42 password.
                </p>
            </Section>

            <Section title="Cookies">
                <p>
                    The site uses a single session cookie so you stay signed in. It
                    expires after 30 minutes and the browser scripts cannot read it.
                    There are no advertising or tracking cookies.
                </p>
            </Section>

            <Section title="How your data is protected">
                <p>
                    All the communication with the site travels over HTTPS. Passwords
                    are hashed with a modern algorithm before being stored. Your data
                    lives in our own database and is never sold or shared with third
                    parties.
                </p>
            </Section>

            <Section title="Your rights">
                <p>
                    You can see and edit your profile data (nickname, avatar, email,
                    password) at any time from the profile page. If you want your
                    account and its data deleted, contact the team and we will remove
                    it.
                </p>
            </Section>

            <Section title="Changes">
                <p>
                    If this policy changes, the date at the top of this page changes
                    with it.
                </p>
            </Section>
        </div>
    );
}

export default Privacy