import os
import sys
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google.adk.cli.fast_api import get_fast_api_app
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json

load_dotenv()
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
AGENT_DIR = BASE_DIR  
SESSION_DB_URL = f"sqlite:///{os.path.join(BASE_DIR, 'sessions.db')}"
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Chat API Models
class Message(BaseModel):
    role: str
    text: str
    time: Optional[float] = None

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # if not provided, use default session

class ChatResponse(BaseModel):
    response: str
    session_id: str
    history: Optional[List[Message]] = None

def _load_session_from_file(session_id: str) -> Optional[Dict[str, Any]]:
    """Helper to load session data from file if it exists."""
    try:
        with open(f"{session_id}.json") as f:
            return json.load(f)
    except Exception:
        return None
app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    session_service_uri=SESSION_DB_URL,
    allow_origins=["*"],  
    web=True,  
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def root():
    """Redirect to chat interface"""
    from fastapi.responses import FileResponse
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
@app.get("/agent-info")
async def agent_info():
    """Provide agent information"""
    from adk_agents import agent
    return {
        "agent_name": agent.root_agent.name,
        "description": agent.root_agent.description,
    }

@app.get("/session-info")
async def session_info():
    """Return information about the current session."""
    from adk_agents import agent
    
    # Try to load the current session
    session_data = _load_session_from_file(agent.SESSION_ID)
    if not session_data:
        return {
            "session_id": agent.SESSION_ID,
            "user_id": agent.USER_ID,
            "app_name": agent.APP_NAME,
            "state": {},
            "events": []
        }
    return session_data

@app.post("/chat")
async def chat(req: ChatRequest) -> ChatResponse:
    """Send a message to the agent and get a response.
    
    The message will be added to the session history along with the agent's response.
    """
    from adk_agents import agent

    # Use provided session_id or default from agent
    session_id = req.session_id or agent.SESSION_ID

    try:
        # Run the query through the agent
        response = await agent.run_query_async(req.message)
        
        # Save session to file (this contains the updated history)
        agent.save_session_to_file(f"{session_id}.json")
        
        # Load the saved session to get history
        session_data = _load_session_from_file(session_id)
        history = []
        if session_data and "events" in session_data:
            history = [
                Message(
                    role=evt["role"],
                    text=evt["text"],
                    time=evt.get("time")
                )
                for evt in session_data["events"]
            ]
        print(f"Chat history for session {session_id}: {history}")
        return ChatResponse(
            response=response,
            session_id=session_id,
            history=history
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str) -> List[Message]:
    """Get the chat history for a specific session."""
    session_data = _load_session_from_file(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    history = []
    if "events" in session_data:
        history = [
            Message(
                role=evt["role"],
                text=evt["text"],
                time=evt.get("time")
            )
            for evt in session_data["events"]
        ]
    return history

@app.post("agent_call")
async def agent_call(agent_name: str, input_data: dict):
    """Endpoint to call a specific agent with input data"""
    from adk_agents import agent
    selected_agent = None
    if agent_name == agent.payload_agent.name:
        selected_agent = agent.payload_agent
    elif agent_name == agent.attack_agent.name:
        selected_agent = agent.attack_agent
    elif agent_name == agent.root_agent.name:
        selected_agent = agent.root_agent
    else:
        return {"error": "Agent not found"}
    # Here you would normally call the agent's method to process input_data
    # For demonstration, we return a mock response
    return {
        "agent": selected_agent.name,
        "input": input_data,
        "response": "This is a mock response from the agent."
    }

if __name__ == "__main__":
    print("Starting FastAPI server...")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=9999, 
        reload=False
    )