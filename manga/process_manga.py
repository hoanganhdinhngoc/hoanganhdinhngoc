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
    print(f"\n[PHÁT HIỆN FILE LỚN] {file_name} ({size_mb:.2f} MB > 22 MB)")

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

def update_meta_valid_count(meta_path, folder_name, count):
    """Cập nhật hoặc thêm dòng 'X valid file' vào cuối file meta.txt"""
    lines = []
    if os.path.exists(meta_path):
        try:
            with open(meta_path, 'r', encoding='utf-8') as f:
                lines = [l.strip() for l in f if l.strip()]
        except Exception:
            pass

    # Nếu file meta.txt chưa có, tạo cấu trúc chuẩn với tên truyện
    if not lines:
        lines = [folder_name]

    # Loại bỏ bất kỳ dòng 'X valid file' hoặc 'X resized file' cũ nào nếu có
    clean_lines = [l for l in lines if not re.match(r'^\d+\s+(?:valid|resized)\s+file', l, re.IGNORECASE)]

    # Thêm dòng mới vào cuối
    clean_lines.append(f"{count} valid file")

    with open(meta_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(clean_lines) + "\n")

def process_library():
    print("=" * 65)
    print(" MANGA LIBRARY - CÔNG CỤ TỰ ĐỘNG CHIA & TỐI ƯU PDF")
    print("=" * 65)
    print(f"Thư mục library: {LIBRARY_DIR}\n")

    if not os.path.exists(LIBRARY_DIR):
        print("[ERROR] Không tìm thấy thư mục library!")
        return

    folders = [f for f in os.listdir(LIBRARY_DIR) if os.path.isdir(os.path.join(LIBRARY_DIR, f))]
    folders.sort()

    total_scanned = 0
    total_skipped = 0
    total_processed = 0

    for folder_name in folders:
        folder_path = os.path.join(LIBRARY_DIR, folder_name)
        
        # Đếm các file PDF hiện tại trong thư mục
        pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf') and os.path.isfile(os.path.join(folder_path, f))]
        current_pdf_count = len(pdf_files)

        if current_pdf_count == 0:
            continue

        total_scanned += 1
        meta_path = os.path.join(folder_path, "meta.txt")

        # Tự động đổi tên các file txt cũ (nếu có) thành meta.txt
        if not os.path.exists(meta_path):
            old_txts = [f for f in os.listdir(folder_path) if f.lower().endswith('.txt')]
            if old_txts:
                old_p = os.path.join(folder_path, old_txts[0])
                os.rename(old_p, meta_path)

        # Đọc thông tin từ file meta.txt
        cached_count = None
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        m = re.match(r'^\s*(\d+)\s+(?:valid|resized)\s+file', line, re.IGNORECASE)
                        if m:
                            cached_count = int(m.group(1))
            except Exception:
                pass

        # Kiểm tra điều kiện bỏ qua
        if cached_count is not None and cached_count == current_pdf_count:
            print(f"[BỎ QUA] {folder_name}: Đã tối ưu ({current_pdf_count} valid file)")
            total_skipped += 1
            continue

        # Nếu số lượng không khớp hoặc chưa từng tối ưu
        if cached_count is not None:
            print(f"\n[PHÁT HIỆN THAY ĐỔI] {folder_name}: Có {current_pdf_count} file PDF (trước đó là {cached_count}) -> Bắt đầu quét...")
        else:
            print(f"\n[QUÉT MỚI] {folder_name}: {current_pdf_count} file PDF -> Bắt đầu kiểm tra...")

        # Tìm các file lớn hơn MAX_SIZE_BYTES
        large_files = []
        for pf in pdf_files:
            p_full = os.path.join(folder_path, pf)
            if is_part_file(pf):
                continue
            if os.path.getsize(p_full) > MAX_SIZE_BYTES:
                large_files.append(p_full)

        if large_files:
            print(f"  -> Có {len(large_files)} file vượt quá 22 MB cần chia nhỏ...")
            for lf in large_files:
                split_pdf_file(lf)
            total_processed += 1
        else:
            print(f"  -> Tất cả {current_pdf_count} file đều đã <= 22 MB.")

        # Cập nhật lại số lượng file PDF thực tế sau khi xử lý vào meta.txt
        updated_pdfs = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf') and os.path.isfile(os.path.join(folder_path, f))]
        final_count = len(updated_pdfs)
        update_meta_valid_count(meta_path, folder_name, final_count)
        print(f"  [ĐÃ CẬP NHẬT] meta.txt -> '{final_count} valid file'")

    print("\n" + "=" * 65)
    print(f" [HOÀN THÀNH TẤT CẢ]")
    print(f" - Tổng số bộ truyện: {total_scanned}")
    print(f" - Bỏ qua (đã tối ưu từ trước): {total_skipped}")
    print(f" - Đã kiểm tra / xử lý: {total_scanned - total_skipped}")
    print(" Giờ anh có thể yên tâm 'git add .', 'git commit' và 'git push'!")
    print("=" * 65)

if __name__ == "__main__":
    process_library()
