import shutil
import subprocess
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile
from fastapi.responses import FileResponse
from pypdf import PdfReader, PdfWriter

from core.plugins import Manifest

manifest = Manifest(
    slug="pdf-compress",
    name="Compress PDF",
    description="Shrink PDF file size by downsampling images and re-compressing streams.",
    icon="compress",
    category="PDF",
)

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[3] / "data"
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

GS_QUALITY_PRESETS = {
    "low": "/screen",     # smallest, most lossy
    "medium": "/ebook",   # good balance
    "high": "/printer",   # larger, higher fidelity
}


def _compress_with_ghostscript(input_path: Path, output_path: Path, quality: str) -> None:
    preset = GS_QUALITY_PRESETS.get(quality, "/ebook")
    subprocess.run(
        [
            "gs",
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={preset}",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={output_path}",
            str(input_path),
        ],
        check=True,
    )


def _compress_with_pypdf(input_path: Path, output_path: Path) -> None:
    reader = PdfReader(str(input_path))
    writer = PdfWriter()

    for page in reader.pages:
        page.compress_content_streams()
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)


@router.post("/compress")
async def compress(file: UploadFile, quality: str = "medium"):
    input_name = f"{uuid.uuid4().hex}.pdf"
    input_path = UPLOAD_DIR / input_name
    with open(input_path, "wb") as f:
        f.write(await file.read())

    output_name = f"{uuid.uuid4().hex}.pdf"
    output_path = OUTPUT_DIR / output_name

    engine = "ghostscript" if shutil.which("gs") else "pypdf"

    if engine == "ghostscript":
        _compress_with_ghostscript(input_path, output_path, quality)
    else:
        _compress_with_pypdf(input_path, output_path)

    original_size = input_path.stat().st_size
    compressed_size = output_path.stat().st_size

    return {
        "download_url": f"/api/apps/pdf-compress/download/{output_name}",
        "engine": engine,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "savings_percent": round((1 - compressed_size / original_size) * 100, 1) if original_size else 0,
    }


@router.get("/download/{filename}")
def download(filename: str):
    path = OUTPUT_DIR / filename
    return FileResponse(path, media_type="application/pdf", filename="compressed.pdf")
