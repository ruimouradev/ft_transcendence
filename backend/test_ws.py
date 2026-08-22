import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.realtime.ws import router

app = FastAPI()
app.include_router(router)

def test_websocket():
    client = TestClient(app)
    # Create the room (Player 1). A room only starts when it is full,
    # so a 2 seat room lets two players play right away.
    with client.websocket_connect("/ws/game/room1") as websocket1:
        websocket1.send_json({"type": "create", "name": "Alice",
                              "settings": {"max_players": 2}})

        welcome1 = websocket1.receive_json()
        assert welcome1["type"] == "welcome"

        data1 = websocket1.receive_json()
        print("P1 Initial State:", data1)
        assert data1["type"] == "state"
        assert data1["you"]["id"] == "p1"
        assert data1["host_id"] == "p1"
        assert data1["settings"]["max_players"] == 2
        assert len(data1["players"]) == 1

        # Join Player 2
        with client.websocket_connect("/ws/game/room1") as websocket2:
            websocket2.send_json({"type": "join", "name": "Bob"})

            welcome2 = websocket2.receive_json()
            assert welcome2["type"] == "welcome"

            data2 = websocket2.receive_json()
            print("P2 Initial State:", data2)
            assert data2["type"] == "state"
            assert data2["you"]["id"] == "p2"
            assert len(data2["players"]) == 2

            # Start Game (sent by P1, the host, with the room full)
            data1 = websocket1.receive_json() # P1 receives P2 join update
            websocket1.send_json({"type": "start"})

            new1 = websocket1.receive_json() # P1 receives deal update
            print("P1 Start Game State:", new1)
            assert new1["phase"] == "playing"
            assert len(new1["you"]["hand"]) == 7
            assert new1["seq"] > data1["seq"]

            # P1 Draws
            websocket1.send_json({"type": "draw"})
            new1 = websocket1.receive_json()
            assert len(new1["you"]["hand"]) == 8

            print("All tests passed successfully!")

def test_join_errors():
    client = TestClient(app)
    # A wrong code is not a full room, each mistake has its own code
    with client.websocket_connect("/ws/game/nowhere") as websocket:
        websocket.send_json({"type": "join", "name": "Alice"})
        error = websocket.receive_json()
        assert error["type"] == "error"
        assert error["code"] == "ROOM_NOT_FOUND"

if __name__ == "__main__":
    test_websocket()
    test_join_errors()
