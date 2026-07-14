import asyncio
import io
import json
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from PIL import Image
from pypdf import PdfWriter, PdfReader

from core.plugins import Manifest

manifest = Manifest(
    slug="pdf-merge",
    name="Merge to PDF",
    description="Combine images and PDFs into a single PDF, in the order provided.",
    icon="merge",
)

router = APIRouter()

OUTPUT_DIR = Path(__file__).resolve().parents[3] / "data" / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".gif"}


def _event(payload: dict) -> str:
    return json.dumps(payload) + "\n"


@router.post("/merge")
async def merge(files: list[UploadFile]):
    # Read all uploads up front (the request body is already fully
    # received by the time this handler runs), then stream progress
    # as each one is processed into the merged PDF.
    pending = [(upload.filename, await upload.read()) for upload in files]
    total = len(pending)

    async def stream():
        writer = PdfWriter()

        for i, (filename, content) in enumerate(pending, start=1):
            suffix = Path(filename or "").suffix.lower()

            if suffix == ".pdf":
                reader = PdfReader(io.BytesIO(content))
                for page in reader.pages:
                    writer.add_page(page)
            elif suffix in IMAGE_EXTS:
                image = Image.open(io.BytesIO(content)).convert("RGB")
                pdf_bytes = io.BytesIO()
                image.save(pdf_bytes, format="PDF")
                pdf_bytes.seek(0)
                reader = PdfReader(pdf_bytes)
                writer.add_page(reader.pages[0])

            yield _event({"type": "progress", "current": i, "total": total, "filename": filename})
            # Let the event loop flush the chunk before the next (fast) file.
            await asyncio.sleep(0)

        output_name = f"{uuid.uuid4().hex}.pdf"
        output_path = OUTPUT_DIR / output_name
        with open(output_path, "wb") as f:
            writer.write(f)

        yield _event({
            "type": "done",
            "download_url": f"/api/apps/pdf-merge/download/{output_name}",
            "pages": len(writer.pages),
        })

    return StreamingResponse(stream(), media_type="application/x-ndjson")


@router.get("/download/{filename}")
def download(filename: str):
    path = OUTPUT_DIR / filename
    # inline (not attachment) so the frontend can render it in an <iframe> preview;
    # the frontend's download link forces a save via the HTML `download` attribute.
    return FileResponse(
        path,
        media_type="application/pdf",
        filename="merged.pdf",
        content_disposition_type="inline",
    )
