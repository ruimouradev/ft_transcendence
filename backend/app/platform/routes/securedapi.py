from app.platform.deps import verify_api_key
from fastapi import APIRouter, Depends


router = APIRouter(prefix="/secured", tags=["secured"])

@router.get("/test",dependencies=[Depends(verify_api_key)])
async def test_secured_api(user_id: str = Depends(verify_api_key)):
    return {"message": "This is a secured API endpoint."}