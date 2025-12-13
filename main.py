import os
import requests
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

CLIENT_ID = os.getenv("WHOOP_CLIENT_ID")
CLIENT_SECRET = os.getenv("WHOOP_CLIENT_SECRET")
REDIRECT_URI = os.getenv("WHOOP_REDIRECT_URI")

AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"

TOKEN_STORE = {}  # temp: will reset if server restarts


@app.get("/")
def root():
    return {"status": "backend running"}


from fastapi.responses import RedirectResponse
from urllib.parse import urlencode, quote
import secrets

@app.get("/login")
def login():
    scopes = ["read:recovery", "read:workout", "read:sleep"]

    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": " ".join(scopes),
        "state": secrets.token_urlsafe(16),
    }

    auth_url = f"{AUTH_URL}?{urlencode(params, quote_via=quote)}"
    return RedirectResponse(auth_url)



from fastapi import Query

@app.get("/callback")
def callback(
    code: str | None = Query(default=None),
    error: str | None = Query(default=None),
    error_description: str | None = Query(default=None),
    state: str | None = Query(default=None),
):
    # WHOOP sent an error instead of a code
    if error:
        return {
            "connected": False,
            "error": error,
            "error_description": error_description,
            "state": state,
        }

    # Nothing came back at all
    if not code:
        return {
            "connected": False,
            "error": "missing_code",
            "hint": "WHOOP redirected here without ?code=. This usually means redirect_uri mismatch or invalid scope/client config.",
            "state": state,
        }

    # Exchange code for token
    resp = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
        },
        timeout=30,
    )

    if resp.status_code >= 400:
        return {"connected": False, "token_error": resp.status_code, "body": resp.text}

    TOKEN_STORE["token"] = resp.json()
    return {"connected": True}



def whoop_get(path: str):
    token = TOKEN_STORE.get("token")
    if not token:
        raise RuntimeError("Not authenticated. Go to /login first, then approve, then come back.")

    headers = {"Authorization": f"Bearer {token['access_token']}"}
    url = f"https://api.prod.whoop.com/developer/v2/{path}"
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()


@app.get("/whoop/summary")
def summary():
    # basic example: last 7 recovery scores
    recovery = whoop_get("recovery")
    scores = [r["score"]["recovery_score"] for r in recovery["records"][:7]]
    avg = round(sum(scores) / len(scores), 1) if scores else None
    return {"recovery_last_7": scores, "avg_recovery_7d": avg}


