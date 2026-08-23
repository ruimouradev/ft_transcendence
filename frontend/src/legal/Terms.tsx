import Section from './Section';

// Os Terms of Service: as regras de utilização do site, escritas para
// o que ele realmente é, um projeto de estudantes. O texto é teu para
// ajustar.

export default function Terms() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-black text-white mb-2">Terms of Service</h1>
            <p className="text-gray-400 text-sm mb-10">Last updated: August 21, 2026</p>

            <Section title="What this is">
                <p>
                    This site is a free, non commercial student project built at
                    42 Lisboa. By creating an account or playing here you agree to
                    these terms. UNO is a trademark of its respective owner; this
                    project is not affiliated with or endorsed by it.
                </p>
            </Section>

            <Section title="Your account">
                <ul className="list-disc pl-6 space-y-1">
                    <li>Use a real email address you control, it is needed to
                        activate the account.</li>
                    <li>Keep your password to yourself. What happens in your
                        account is your responsibility.</li>
                    <li>Pick a nickname and an avatar that are not offensive and
                        do not pretend to be someone else.</li>
                </ul>
            </Section>

            <Section title="Fair play">
                <ul className="list-disc pl-6 space-y-1">
                    <li>Play the game yourself. Automating your moves or using a
                        second account to gain an advantage is not allowed.</li>
                    <li>Do not exploit bugs. If you find one, tell the team
                        instead.</li>
                    <li>Be decent to the other players.</li>
                </ul>
                <p>
                    Accounts that break these rules can be suspended or removed.
                </p>
            </Section>

            <Section title="Availability and your data">
                <p>
                    This is an educational project offered as is: we do our best to
                    keep it running, but there is no guarantee of availability, and
                    game data may be reset during development. You can ask for your
                    account to be deleted at any time, as described in the Privacy
                    Policy.
                </p>
            </Section>

            <Section title="Changes">
                <p>
                    If these terms change, the date at the top of this page changes
                    with it. Playing after a change means you accept the new terms.
                </p>
            </Section>
        </div>
    );
}
