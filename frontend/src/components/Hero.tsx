export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-8 py-12">

      <div className="grid grid-cols-2 items-center">

        <div>

          <h1 className="text-7xl font-black leading-tight">
            <span className="text-yellow-400">
              UNO!
            </span>

          </h1>

          <p className="text-gray-400 mt-6 text-xl">

            Challenge your friends online.

          </p>

          <div className="flex gap-5 mt-10">

            <button className="bg-red-500 px-8 py-4 rounded-xl text-xl hover:bg-red-600">

              Quick Play

            </button>

            <button className="bg-white/10 px-8 py-4 rounded-xl">

              Create Room

            </button>

          </div>

        </div>

        <div className="flex justify-center">

          <img
            src="/uno-cards.png"
            className="w-[650px]"
          />

        </div>

      </div>

    </section>
  );
}