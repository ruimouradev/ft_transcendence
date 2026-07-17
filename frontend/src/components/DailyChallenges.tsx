import Card from "./Card";

export default function DailyChallenges() {
  return (
    <Card title="Daily Challenges">

      <Task
        title="Play 3 Games"
        progress={60}
      />

      <Task
        title="Win One Match"
        progress={20}
      />

      <Task
        title="Play with Friends"
        progress={80}
      />

    </Card>
  );
}

function Task({
  title,
  progress,
}: any) {
  return (
    <div className="mb-5">

      <div className="flex justify-between">

        <span>{title}</span>

        <span>{progress}%</span>

      </div>

      <div className="bg-white/10 h-2 rounded mt-2">

        <div
          style={{
            width: `${progress}%`,
          }}
          className="h-2 bg-green-400 rounded"
        />

      </div>

    </div>
  );
}