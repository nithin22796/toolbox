# Toolbox

Local, private, multi-tool app. Backend is FastAPI with a plugin-folder
architecture; frontend is Next.js. Everything runs on your machine, no
cloud calls.

## Run

```
./run.sh
```

- Frontend: http://localhost:3000 (or next free port — check terminal output)
- Backend: http://localhost:8000 (docs at /docs)

First time only:

```
cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cd ../frontend && npm install
brew install ghostscript   # optional, enables real PDF compression
```

## Adding a new tool

Create a folder under `backend/apps/<your_tool>/__init__.py` exporting:

```python
from fastapi import APIRouter
from core.plugins import Manifest

manifest = Manifest(slug="your-tool", name="Your Tool", description="...")
router = APIRouter()

@router.post("/do-thing")
async def do_thing(...):
    ...
```

It's auto-discovered and shows up on the dashboard and at
`/api/apps/<slug>/...`. Add a matching page under
`frontend/app/tools/<slug>/page.tsx` for the UI.

## Current tools

- **pdf-merge** — combine images/PDFs into one PDF
- **pdf-compress** — shrink PDF size via Ghostscript (falls back to pypdf
  stream compression if Ghostscript isn't installed)
