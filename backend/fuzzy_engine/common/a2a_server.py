from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uvicorn

def create_app(agent):
    app = FastAPI()
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.post("/run")
    async def run(payload: dict):
        try:
            if isinstance(payload.get("prompt"), str):
                import json
                payload["prompt"] = json.loads(payload["prompt"])
            result = await agent.execute(payload["prompt"])
            return result
        except Exception as e:
            import traceback
            return {"error": str(e), "traceback": traceback.format_exc()}
    
    # Mount the frontend directory
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "frontend")
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
    
    return app
