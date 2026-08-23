// Uma secção das páginas legais, para o texto ficar todo com a
// mesma cara nas duas.
export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">{children}</div>
        </section>
    );
}
