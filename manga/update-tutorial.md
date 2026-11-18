# Hướng Dẫn Cập Nhật Truyện Mới Lên Cloudflare R2

Thư viện truyện được lưu trữ hoàn toàn trên **Cloudflare R2 Private Bucket** (`manga-library`) và phát trực tiếp về website thông qua Cloudflare Pages Function (`/api/manga/*`). Nhờ vậy bạn có thể lưu file PDF dung lượng lớn nguyên bản (không bị giới hạn 25 MB của GitHub/Cloudflare Pages) và cập nhật truyện mới mà không làm phình dung lượng repo Git.

---

## Bước 1: Chuẩn bị thư mục truyện mới

Tạo một thư mục con mới bên trong `manga/library/`:

```text
manga/
└── library/
    └── ten-bo-truyen/
        ├── meta.txt
        ├── thumbnail.jpg
        ├── Tap 01.pdf
        └── Tap 02.pdf
```

### Quy tắc chi tiết

1. **Tên thư mục (`ten-bo-truyen`)**
   - Viết thường, không dấu, nối nhau bằng dấu gạch ngang `-` (ví dụ: `bi-mat-dao-lincoln`, `doraemon-long`).
   - Không đặt dấu chấm `.` ở đầu tên thư mục (các thư mục bắt đầu bằng `.` sẽ bị bỏ qua).

2. **Các file truyện (`.pdf`)**
   - Giữ nguyên file PDF gốc, **không cần cắt nhỏ dưới 25 MB** nữa (hệ thống reader tự động stream từng mảnh 512 KB theo chuẩn HTTP Range Request).
   - Có thể đặt 1 file hoặc nhiều tập trong cùng thư mục. Tên file (bỏ đuôi `.pdf`) chính là tên tập hiển thị trên web và được sắp xếp theo thứ tự số tự nhiên (`1, 2, ..., 10`).
   - *Lưu ý:* Công cụ tự động bỏ qua các file có dạng tên cũ `*.part1.pdf`, `*.part2.pdf`... nếu còn sót lại.

3. **File thông tin `meta.txt`** *(nên lưu với bảng mã **UTF-8**)*
   - **Dòng 1:** Tên bộ truyện hiển thị trên website (ví dụ: `Bí mật đảo Lincoln`)
   - **Dòng 2:** Tên tác giả (ví dụ: `Jules Verne`)
   - **Dòng 3:** Năm phát hành (ví dụ: `1875`)
   - *Tự động hóa:* Nếu bạn quên tạo `meta.txt`, công cụ sẽ tự sinh một file `meta.txt` mẫu dựa theo tên thư mục để bạn chỉnh sửa lại sau.

4. **Ảnh bìa `thumbnail.jpg`** *(hỗ trợ `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`)*
   - Tên file bắt buộc là `thumbnail.<đuôi_ảnh>` (không phân biệt hoa/thường).
   - *Tự động hóa:* Nếu chưa bỏ sẵn ảnh bìa, công cụ sẽ tự động chụp lại **trang đầu tiên** của file PDF đầu tiên trong thư mục để tạo `thumbnail.jpg`.

---

## Bước 2: Đẩy (Sync) truyện mới lên Cloudflare R2

Sau khi chuẩn bị xong thư mục trong `manga/library/`, chạy công cụ đồng bộ theo **1 trong 2 cách** dưới đây:

- **Cách 1 (Nhanh nhất):** Mở thư mục `manga/` trên File Explorer và **nhấp đúp chạy file `optimize_manga.bat`**.
- **Cách 2 (Dùng Terminal / PowerShell):**
  ```powershell
  cd "d:\Core Data\Programming Nest\Github Cloud\GitHub\hoanganhdinhngoc\manga"
  python process_manga.py
  ```

*(Lần đầu chạy trên máy chưa có thư viện Python cần thiết, script sẽ tự động cài đặt `pymupdf` và `boto3`.)*

### Quy trình tự động của `process_manga.py`
1. Quét toàn bộ các thư mục trong `manga/library/`, tạo `meta.txt` / `thumbnail.jpg` nếu thư mục mới chưa có.
2. Đếm tổng số trang của từng file PDF mới hoặc vừa thay đổi (các file cũ không đổi sẽ dùng lại kết quả đã lưu trong `.r2_sync_cache.json` để chạy rất nhanh).
3. Đối chiếu danh sách file với Cloudflare R2 bucket (`manga-library`):
   - **Chỉ tải lên** các file mới hoặc có dung lượng thay đổi (upload song song 6 luồng).
   - **Tự động xóa trên R2** những file/thư mục không còn tồn tại trong `manga/library/` ở máy local.
4. Đóng gói lại toàn bộ danh mục truyện thành file `catalog.json` và tải lên R2 sau cùng.

---

## Bước 3: Kiểm tra trên Website

- Khi màn hình console báo **`HOÀN TẤT ĐỒNG BỘ THƯ VIỆN TRUYỆN LÊN CLOUDFLARE R2!`**, bạn chỉ cần mở website đọc truyện và nhấn tải lại trang (**F5 / Ctrl + R**).
- **Không cần chạy `git add`, `git commit`, `git push`** khi bạn chỉ thêm, sửa hoặc xóa truyện:
  - Thư mục `manga/library/`, `.r2_env` và `.r2_sync_cache.json` đã được đưa vào `.gitignore` để giữ kho Git nhẹ và bảo mật key R2.
  - Website đọc trực tiếp `catalog.json` (chế độ `no-cache`), ảnh bìa và PDF từ R2 qua `/api/manga/*` nên mọi thay đổi có hiệu lực ngay lập tức sau khi sync xong.
- **Chỉ cần `git commit` và `git push`** khi bạn chỉnh sửa mã nguồn hoặc cấu hình hệ thống (ví dụ: `manga/index.html`, `manga/process_manga.py`, `functions/api/manga/[[path]].js`, `_headers`...).

---

## Phụ lục: Các thao tác thường gặp

- **Sửa tên truyện, tác giả, năm phát hành (`meta.txt`) hoặc thay ảnh bìa (`thumbnail`):**
  1. Sửa lại file trong `manga/library/<ten-thu-muc>/`.
  2. Chạy lại `optimize_manga.bat`.
  - *Mẹo nhỏ:* Script kiểm tra file cần upload lại dựa theo **kích thước byte** (`local_size != remote_size`). Nếu bạn sửa chữ trong `meta.txt` mà tổng số byte vô tình giữ nguyên y hệt bản cũ (ví dụ thay đổi đúng 1 ký tự cùng độ dài byte), hãy thêm một khoảng trắng hoặc dòng mới ở cuối file trước khi chạy lại `optimize_manga.bat`.
- **Xóa một tập truyện hoặc cả bộ truyện:**
  - Xóa file PDF hoặc xóa cả thư mục truyện tương ứng trong `manga/library/` trên máy, sau đó chạy `optimize_manga.bat`. Script sẽ tự dọn các file đó khỏi R2 và cập nhật lại `catalog.json`.
- **Cấu hình kết nối R2 khi chuyển sang máy tính mới:**
  - Tạo file `manga/.r2_env` (không commit file này lên Git) với 4 biến môi trường:
    ```env
    R2_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
    R2_BUCKET_NAME=manga-library
    R2_ACCESS_KEY_ID=<YOUR_ACCESS_KEY_ID>
    R2_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY>
    ```
