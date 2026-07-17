import Card from "./Card";

export default function NewsPanel() {
  return (
    <Card title="News">

      <News
        title="Season 1 Starts!"
      />

      <News
        title="Leaderboard Updated"
      />

      <News
        title="New UNO Cards Released"
      />

    </Card>
  );
}

function News({
  title,
}: any) {
  return (
    <div className="py-4 border-b border-white/10">

      <div className="font-bold">
        {title}
      </div>

      <div className="text-gray-400 text-sm">

        Read More...

      </div>

    </div>
  );
}