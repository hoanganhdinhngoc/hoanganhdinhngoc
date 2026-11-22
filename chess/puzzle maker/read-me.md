### Ghi chú các trường hợp lệ hiện tại trong hệ thống:

1. **`cat` và `sub`:**
   * `tactics` → `fork`, `pin`, `skewer`, `discovered` (hoặc bạn có thể đặt tên nhánh con mới nếu muốn thêm nhóm mới)
   * `mates` → `backrank`, `smothered`, `anastasia`, `arabian`, `boden`, `opera` *(Lưu ý: nhóm `mates` bắt buộc nước cuối trong `moves` phải chiếu hết `checkmate`)*
   * `endgames` → `lucena`, `philidor`, `opposition`, `breakthrough`, `queen-pawn`
   * `historical` → `morphy`, `anderssen`, `tal`, `fischer`, `kasparov`, `carlsen`, `polgar`, `spassky`, `legends`

2. **`fen` (Cách bày cờ & điều kiện):**
   * Đủ 1 Vua Trắng & 1 Vua Đen không đứng kề nhau, không có Tốt hàng 1/8, và **phe sắp đi (sau nước của đối thủ vừa đi)** là phe giải đố, còn **phe đối phương không được đang bị chiếu sẵn** ở trạng thái ban đầu.
   * Nên dựng bàn cờ bằng chính tính năng **Board Editor** của **NieR Study** ở bản vừa làm để kiểm tra hợp lệ tức thì rồi bấm **Sao chép FEN**.

3. **`moves` (Đáp án từng nước một):**
   * Ghi theo chuẩn **UCI** lần lượt xen kẽ: `[nước_người_chơi_1, nước_máy_trả_lời_1, nước_người_chơi_2, ...]` (ví dụ `e2e4`, phong cấp thêm ký tự quân ở cuối như `e7e8q`). Số phần tử thường là số lẻ (bắt đầu và kết thúc bằng nước đi của người chơi). *(Nếu bạn quen ghi nước đi dạng ký hiệu đại số như `1. Qb8+ Nxb8 2. Rd8#`, bạn chỉ cần ghi nguyên văn vậy, khi tích hợp mình sẽ đổi sang UCI và quét lại qua Stockfish luôn)*.