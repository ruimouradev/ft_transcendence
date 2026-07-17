import Card from "./Card";

const friends = [
  "Alice",
  "Bob",
  "Charlie",
  "David",
];

export default function FriendsPanel() {
  return (
    <Card title="Online Friends">

      {friends.map(friend => (

        <div
          key={friend}
          className="flex justify-between items-center py-3 border-b border-white/10"
        >

          <div>

            <div>{friend}</div>

            <div className="text-green-400 text-sm">
              Online
            </div>

          </div>

          <button className="bg-indigo-500 px-4 py-2 rounded">

            Invite

          </button>

        </div>

      ))}

    </Card>
  );
}