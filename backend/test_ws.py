import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.realtime.ws import router
from unittest.mock import patch

app = FastAPI()
app.include_router(router)

@patch('app.realtime.ws.user_from_cookies', return_value='123e4567-e89b-12d3-a456-426614174000')
def test_websocket(mock_user):
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

            # Both players should receive the updated state
            data1 = websocket1.receive_json()
            data2 = websocket2.receive_json()
            
            assert len(data1["players"]) == 2
            assert data2["type"] == "state"
            assert data2["you"]["id"] == "p2"

            # Start game
            websocket1.send_json({"type": "start"})

            data1 = websocket1.receive_json()
            data2 = websocket2.receive_json()

            assert data1["phase"] == "playing"
            assert data2["phase"] == "playing"
            
            # Check someone has the turn
            assert data1["turn"] in ["p1", "p2"]
