from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.plugins import discover_plugins

app = FastAPI(title="Toolbox")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)

plugins = discover_plugins()

for plugin in plugins:
    app.include_router(
        plugin.router,
        prefix=f"/api/apps/{plugin.manifest.slug}",
        tags=[plugin.manifest.name],
    )


@app.get("/api/apps")
def list_apps():
    return [
        {
            "slug": p.manifest.slug,
            "name": p.manifest.name,
            "description": p.manifest.description,
            "icon": p.manifest.icon,
            "category": p.manifest.category,
        }
        for p in plugins
    ]
