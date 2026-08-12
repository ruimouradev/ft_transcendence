import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.realtime.ws import router
from app.game.contract import Join

app = FastAPI()
app.include_router(router)

def test_websocket():
    client = TestClient(app)
    # Join Player 1
    with client.websocket_connect("/ws/game/room1") as websocket1:
        websocket1.send_json({"type": "join", "name": "Alice"})
        
        welcome1 = websocket1.receive_json()
        assert welcome1["type"] == "welcome"
        
        data1 = websocket1.receive_json()
        print("P1 Initial State:", data1)
        assert data1["type"] == "state"
        assert data1["you"]["id"] == "p1"
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
            
            # Start Game (sent by P1)
            websocket1.receive_json() # P1 receives P2 join update
            websocket1.send_json({"type": "start"})
            
            data1 = websocket1.receive_json() # P1 receives deal update
            print("P1 Start Game State:", data1)
            assert data1["phase"] == "playing"
            assert len(data1["you"]["hand"]) == 7
            
            # P1 Draws
            websocket1.send_json({"type": "draw"})
            data1 = websocket1.receive_json()
            assert len(data1["you"]["hand"]) == 8

            print("All tests passed successfully!")

if __name__ == "__main__":
    test_websocket()
