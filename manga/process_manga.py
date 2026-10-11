import os
import sys
import math
import shutil
import re

# Đảm bảo in tiếng Việt trên console Windows không bị lỗi encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

try:
    import pymupdf
except ImportError:
    print("[ERROR] Thư viện 'pymupdf' chưa được cài đặt.")
    print("Vui lòng chạy lệnh: pip install pymupdf")
    sys.exit(1)

# Ngưỡng kích thước tối đa cho mỗi file PDF (Cloudflare Pages limit là 25 MiB)
# Đặt ngưỡng an toàn là 22 MB để đảm bảo không bao giờ bị reject
MAX_SIZE_BYTES = 22 * 1024 * 1024  # 22 MB
TARGET_PART_SIZE = 18 * 1024 * 1024  # 18 MB cho mỗi phần

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LIBRARY_DIR = os.path.join(BASE_DIR, "library")
BACKUP_DIR = os.path.join(BASE_DIR, ".originals")

def is_part_file(filename):
    """Kiểm tra xem file có phải là file đã được chia nhỏ (.partX.pdf) hay không"""
    return bool(re.search(r'\.part\d+\.pdf$', filename, re.IGNORECASE))

def split_pdf_file(pdf_path):
    file_size = os.path.getsize(pdf_path)
    file_name = os.path.basename(pdf_path)
    folder_path = os.path.dirname(pdf_path)
    rel_folder = os.path.relpath(folder_path, LIBRARY_DIR)

    size_mb = file_size / (1024 * 1024)
    print(f"\n[PHÁT HIỆN] {file_name} ({size_mb:.2f} MB > 22 MB)")

    doc = pymupdf.open(pdf_path)
    total_pages = len(doc)
    print(f"  -> Tổng số trang: {total_pages} trang")

    base_name = re.sub(r'\.pdf$', '', file_name, flags=re.IGNORECASE)

    # Tính toán số lượng part cần chia
    num_parts = max(2, math.ceil(file_size / TARGET_PART_SIZE))

    while True:
        pages_per_part = math.ceil(total_pages / num_parts)
        temp_parts = []
        all_ok = True

        for i in range(1, num_parts + 1):
            start_p = (i - 1) * pages_per_part
            end_p = min(i * pages_per_part - 1, total_pages - 1)
            if start_p > end_p:
                break

            part_filename = f"{base_name}.part{i}.pdf"
            part_path = os.path.join(folder_path, part_filename)

            part_doc = pymupdf.open()
            part_doc.insert_pdf(doc, from_page=start_p, to_page=end_p)
            part_doc.save(part_path, deflate=True)
            part_doc.close()

            p_size = os.path.getsize(part_path)
            temp_parts.append((part_path, p_size, start_p + 1, end_p + 1))

            if p_size > MAX_SIZE_BYTES:
                all_ok = False

        if all_ok:
            break
        else:
            # Nếu có part vẫn vượt 22MB, xóa các part vừa tạo và tăng số lượng part
            for p_path, _, _, _ in temp_parts:
                if os.path.exists(p_path):
                    os.remove(p_path)
            num_parts += 1
            print(f"  -> Tăng số phần chia thành {num_parts} để đảm bảo mỗi file < 22 MB...")

    doc.close()

    print(f"  -> Đã chia thành công thành {len(temp_parts)} phần:")
    for p_path, p_size, s_p, e_p in temp_parts:
        p_mb = p_size / (1024 * 1024)
        print(f"     + {os.path.basename(p_path)}: {p_mb:.2f} MB (Trang {s_p} - {e_p})")

    # Sao lưu file gốc vào thư mục .originals
    dest_backup_folder = os.path.join(BACKUP_DIR, rel_folder)
    os.makedirs(dest_backup_folder, exist_ok=True)
    backup_file_path = os.path.join(dest_backup_folder, file_name)

    print(f"  -> Di chuyển file gốc an toàn vào thư mục backup: .originals/{rel_folder}")
    if os.path.exists(backup_file_path):
        os.remove(backup_file_path)
    shutil.move(pdf_path, backup_file_path)
    print(f"  [XONG] Hoàn tất xử lý: {file_name}")

def process_library():
    print("=" * 60)
    print(" MANGA LIBRARY - CÔNG CỤ TỰ ĐỘNG CHIA & TỐI ƯU PDF")
    print("=" * 60)
    print(f"Thư mục library: {LIBRARY_DIR}")

    if not os.path.exists(LIBRARY_DIR):
        print("[ERROR] Không tìm thấy thư mục library!")
        return

    large_files = []
    normal_files = 0
    part_files = 0

    for root, dirs, files in os.walk(LIBRARY_DIR):
        for f in files:
            if not f.lower().endswith(".pdf"):
                continue
            fpath = os.path.join(root, f)
            if is_part_file(f):
                part_files += 1
                continue
            fsize = os.path.getsize(fpath)
            if fsize > MAX_SIZE_BYTES:
                large_files.append((fpath, fsize))
            else:
                normal_files += 1

    print(f"Tìm thấy:")
    print(f" - {normal_files} file PDF chuẩn (<= 22 MB)")
    print(f" - {part_files} file đã chia nhỏ (.partX.pdf)")
    print(f" - {len(large_files)} file vượt quá 22 MB cần xử lý")

    if not large_files:
        print("\n[TUYỆT VỜI] Không có file nào vượt quá 22 MB!")
        print("Tất cả file đều đã sẵn sàng để deploy lên Cloudflare Pages.")
        return

    print(f"\nBắt đầu xử lý {len(large_files)} file lớn...")
    for fpath, _ in large_files:
        split_pdf_file(fpath)

    print("\n" + "=" * 60)
    print(" [HOÀN THÀNH TẤT CẢ]")
    print(" Giờ anh có thể yên tâm 'git add .', 'git commit' và 'git push'!")
    print(" Cloudflare Pages sẽ deploy thành công 100%.")
    print("=" * 60)

if __name__ == "__main__":
    process_library()
