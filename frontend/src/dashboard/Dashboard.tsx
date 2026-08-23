import Hero from "./Hero";

// A página de entrada. Por agora é só o convite a jogar: os painéis
// que aqui viviam mostravam dados inventados e foram embora. Quando
// houver conteúdo verdadeiro para dar as boas-vindas (últimos jogos,
// amigos online a partir do /friends/all), é aqui que ele entra.
export default function Dashboard() {
    return (
        <div>
            <Hero />
        </div>
    );
}
