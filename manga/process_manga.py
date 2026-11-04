"""
Manga Library — Automatic Metadata Builder & Private Cloudflare R2 Sync
========================================================================
Chức năng:
  1. Không còn cắt nhỏ file PDF (< 25MB) vì Cloudflare R2 hỗ trợ file nguyên bản (lên tới 5TB/file).
  2. Nếu phát hiện folder truyện mới chưa có `meta.txt`, tự động tạo sẵn file `meta.txt` mẫu.
  3. Nếu phát hiện folder truyện mới chưa có `thumbnail.(jpg|png|webp)`, tự động trích xuất trang 1
     của tập PDF đầu tiên làm `thumbnail.jpg`.
  4. Tự động đếm số trang của từng tập PDF (có lưu cache cục bộ để lần chạy sau siêu nhanh) và
     đóng gói toàn bộ thông tin thư viện thành `catalog.json`.
  5. Tự động đồng bộ (Upload file mới/sửa đổi & Xóa file thừa) lên Private Bucket Cloudflare R2.
"""

import os
import re
import sys
import json
import time
import mimetypes
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        print("[!] Chưa cài đặt thư viện PyMuPDF. Đang tự động cài đặt...")
        os.system(f'"{sys.executable}" -m pip install pymupdf')
        import pymupdf as fitz

try:
    import boto3
    from botocore.config import Config
except ImportError:
    print("[!] Chưa cài đặt thư viện boto3. Đang tự động cài đặt...")
    os.system(f'"{sys.executable}" -m pip install boto3')
    import boto3
    from botocore.config import Config

SCRIPT_DIR = Path(__file__).resolve().parent
LIBRARY_DIR = SCRIPT_DIR / "library"
ENV_FILE = SCRIPT_DIR / ".r2_env"
CACHE_FILE = SCRIPT_DIR / ".r2_sync_cache.json"

THUMB_REGEX = re.compile(r"^thumbnail\.(jpg|jpeg|png|webp|gif)$", re.IGNORECASE)


def load_env(env_path: Path) -> dict:
    env = {}
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def load_cache() -> dict:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"pages": {}}


def save_cache(cache: dict):
    try:
        CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def natural_sort_key(s: str):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r"(\d+)", s)]


def ensure_meta_and_thumbnail(folder_path: Path, pdf_files: list[Path]):
    """Tự động tạo meta.txt và thumbnail.jpg nếu folder truyện mới chưa có."""
    meta_path = folder_path / "meta.txt"
    if not meta_path.exists():
        default_title = folder_path.name.replace("-", " ").replace("_", " ").title()
        meta_content = f"{default_title}\nUnknown Author\n2026\n"
        meta_path.write_text(meta_content, encoding="utf-8")
        print(f"  [+] Đã tạo meta.txt mẫu cho: {folder_path.name}")

    has_thumb = any(THUMB_REGEX.match(f.name) for f in folder_path.iterdir() if f.is_file())
    if not has_thumb and pdf_files:
        first_pdf = pdf_files[0]
        thumb_path = folder_path / "thumbnail.jpg"
        try:
            with fitz.open(first_pdf) as doc:
                if len(doc) > 0:
                    page = doc[0]
                    pix = page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2), alpha=False)
                    pix.save(str(thumb_path))
                    print(f"  [+] Đã tự động trích xuất thumbnail.jpg từ: {first_pdf.name}")
        except Exception as e:
            print(f"  [!] Không thể tạo thumbnail tự động cho {folder_path.name}: {e}")


def get_pdf_page_count(pdf_path: Path, cache: dict) -> int:
    stat = pdf_path.stat()
    rel_key = str(pdf_path.relative_to(LIBRARY_DIR)).replace("\\", "/")
    sig = f"{stat.st_size}:{int(stat.st_mtime)}"

    cached = cache.get("pages", {}).get(rel_key)
    if cached and cached.get("sig") == sig and cached.get("pages", 0) > 0:
        return cached["pages"]

    pages = 0
    try:
        with fitz.open(pdf_path) as doc:
            pages = len(doc)
    except Exception as e:
        print(f"  [!] Lỗi đọc số trang {pdf_path.name}: {e}")

    cache.setdefault("pages", {})[rel_key] = {"sig": sig, "pages": pages}
    return pages


def build_local_catalog(cache: dict) -> tuple[dict, dict[str, Path]]:
    """Quét toàn bộ manga/library, tạo catalog.json và danh sách file cần đồng bộ lên R2."""
    publications = []
    local_files_map: dict[str, Path] = {}

    folders = sorted(
        [d for d in LIBRARY_DIR.iterdir() if d.is_dir() and not d.name.startswith(".")],
        key=lambda d: natural_sort_key(d.name),
    )

    for folder in folders:
        folder_id = folder.name

        # Nếu còn sót file .partX.pdf cũ thì bỏ qua cảnh báo
        pdf_files = sorted(
            [
                f
                for f in folder.iterdir()
                if f.is_file()
                and f.suffix.lower() == ".pdf"
                and not re.search(r"\.part\d+\.pdf$", f.name, re.IGNORECASE)
            ],
            key=lambda f: natural_sort_key(f.stem),
        )

        ensure_meta_and_thumbnail(folder, pdf_files)

        # Đọc meta.txt
        title = folder_id.replace("-", " ").replace("_", " ")
        author = ""
        year = ""
        meta_path = folder / "meta.txt"
        if meta_path.exists():
            lines = [ln.strip() for ln in meta_path.read_text(encoding="utf-8", errors="replace").splitlines()]
            if len(lines) > 0 and lines[0]:
                title = lines[0]
            if len(lines) > 1 and lines[1]:
                author = lines[1]
            if len(lines) > 2 and lines[2]:
                year = lines[2]
            local_files_map[f"{folder_id}/meta.txt"] = meta_path

        # Tìm thumbnail
        thumb_key = None
        for f in folder.iterdir():
            if f.is_file() and THUMB_REGEX.match(f.name):
                thumb_key = f"{folder_id}/{f.name}"
                local_files_map[thumb_key] = f
                break

        chapters = []
        for pdf_file in pdf_files:
            r2_key = f"{folder_id}/{pdf_file.name}"
            local_files_map[r2_key] = pdf_file
            pages = get_pdf_page_count(pdf_file, cache)
            chapters.append(
                {
                    "name": pdf_file.stem,
                    "file": r2_key,
                    "size": pdf_file.stat().st_size,
                    "pages": pages,
                }
            )

        publications.append(
            {
                "id": folder_id,
                "title": title,
                "author": author,
                "year": year,
                "thumbnail": thumb_key,
                "chapters": chapters,
            }
        )
        print(f"  [OK] {title} ({folder_id}): {len(chapters)} tập")

    publications.sort(key=lambda p: natural_sort_key(p["title"]))
    catalog = {
        "version": 1,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "publications": publications,
    }
    return catalog, local_files_map


def guess_content_type(filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".jpg") or lower.endswith(".jpeg"):
        return "image/jpeg"
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith(".webp"):
        return "image/webp"
    if lower.endswith(".gif"):
        return "image/gif"
    if lower.endswith(".txt"):
        return "text/plain; charset=utf-8"
    if lower.endswith(".json"):
        return "application/json; charset=utf-8"
    ct, _ = mimetypes.guess_type(filename)
    return ct or "application/octet-stream"


def sync_to_r2(catalog: dict, local_files_map: dict[str, Path], env: dict):
    endpoint_url = env.get("R2_ENDPOINT_URL")
    bucket_name = env.get("R2_BUCKET_NAME", "manga-library")
    access_key = env.get("R2_ACCESS_KEY_ID")
    secret_key = env.get("R2_SECRET_ACCESS_KEY")

    if not endpoint_url or not access_key or not secret_key:
        print("\n[!] Thiếu cấu hình R2 trong file manga/.r2_env!")
        return

    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
        config=Config(signature_version="s3v4", max_pool_connections=16),
    )

    print(f"\n[*] Đang kiểm tra danh sách file hiện có trên Cloudflare R2 ({bucket_name})...")
    remote_objects: dict[str, int] = {}
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket_name):
        for obj in page.get("Contents", []):
            remote_objects[obj["Key"]] = obj["Size"]

    to_upload: list[tuple[str, Path, int]] = []
    for key, path in local_files_map.items():
        local_size = path.stat().st_size
        if remote_objects.get(key) != local_size:
            to_upload.append((key, path, local_size))

    to_delete = [
        key for key in remote_objects.keys() if key != "catalog.json" and key not in local_files_map
    ]

    total_upload_bytes = sum(item[2] for item in to_upload)
    print(
        f"[*] Cần tải lên R2: {len(to_upload)} file ({total_upload_bytes / (1024*1024):.1f} MB) | "
        f"Đã đồng bộ sẵn: {len(local_files_map) - len(to_upload)} file | "
        f"Cần xóa khỏi R2: {len(to_delete)} file"
    )

    if to_upload:
        start_time = time.time()
        completed_count = 0
        uploaded_bytes = 0

        def upload_one(item: tuple[str, Path, int]):
            key, path, size = item
            ct = guess_content_type(path.name)
            s3.upload_file(
                str(path),
                bucket_name,
                key,
                ExtraArgs={"ContentType": ct},
            )
            return key, size

        with ThreadPoolExecutor(max_workers=6) as pool:
            futures = [pool.submit(upload_one, item) for item in to_upload]
            for fut in as_completed(futures):
                key, size = fut.result()
                completed_count += 1
                uploaded_bytes += size
                elapsed = max(0.1, time.time() - start_time)
                speed_mb = (uploaded_bytes / (1024 * 1024)) / elapsed
                pct = (uploaded_bytes / max(1, total_upload_bytes)) * 100
                print(
                    f"  -> [{completed_count}/{len(to_upload)}] ({pct:5.1f}% | {speed_mb:.1f} MB/s) Đã tải lên: {key}"
                )

    if to_delete:
        for key in to_delete:
            s3.delete_object(Bucket=bucket_name, Key=key)
            print(f"  [-] Đã xóa file cũ trên R2: {key}")

    # Upload catalog.json cuối cùng
    catalog_bytes = json.dumps(catalog, ensure_ascii=False, indent=2).encode("utf-8")
    s3.put_object(
        Bucket=bucket_name,
        Key="catalog.json",
        Body=catalog_bytes,
        ContentType="application/json; charset=utf-8",
    )
    print("[+] Đã cập nhật catalog.json lên Cloudflare R2 thành công!")


def main():
    if not LIBRARY_DIR.exists():
        print(f"[!] Không tìm thấy thư mục: {LIBRARY_DIR}")
        return

    print("========================================================")
    print("  MANGA LIBRARY — QUÉT METADATA & ĐỒNG BỘ CLOUDFLARE R2 ")
    print("========================================================\n")

    cache = load_cache()
    catalog, local_files_map = build_local_catalog(cache)
    save_cache(cache)

    env = load_env(ENV_FILE)
    sync_to_r2(catalog, local_files_map, env)

    print("\n========================================================")
    print("  HOÀN TẤT ĐỒNG BỘ THƯ VIỆN TRUYỆN LÊN CLOUDFLARE R2!")
    print("========================================================")


if __name__ == "__main__":
    main()
