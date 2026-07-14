import importlib
import pkgutil
from dataclasses import dataclass

from fastapi import APIRouter


@dataclass
class Manifest:
    slug: str
    name: str
    description: str
    icon: str = "app"


@dataclass
class Plugin:
    manifest: Manifest
    router: APIRouter


def discover_plugins(package_name: str = "apps") -> list[Plugin]:
    """Import every immediate subpackage of `package_name` that exposes
    both a `manifest` and a `router`, and return them as Plugins."""
    plugins: list[Plugin] = []

    package = importlib.import_module(package_name)

    for _, module_name, is_pkg in pkgutil.iter_modules(package.__path__):
        if not is_pkg:
            continue

        module = importlib.import_module(f"{package_name}.{module_name}")

        manifest = getattr(module, "manifest", None)
        router = getattr(module, "router", None)

        if manifest is None or router is None:
            continue

        plugins.append(Plugin(manifest=manifest, router=router))

    return plugins
