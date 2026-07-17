export default function Card({
  title,
  children,
}: any) {
  return (
    <div className="rounded-3xl bg-white/5 backdrop-blur p-6 border border-white/10">

      <h2 className="text-2xl font-bold mb-6">
        {title}
      </h2>

      {children}

    </div>
  );
}