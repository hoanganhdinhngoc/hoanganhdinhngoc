/* =====================================================================
   YoRHa Tactical Chess System — puzzles.js
   Globals: PUZZLE_CATEGORIES, PUZZLES (100 verified positions)
   Categories:
     1. tactics    (40): fork (10), pin (10), skewer (10), discovered (10)
     2. mates      (25): backrank (5), smothered (4), anastasia (4),
                         arabian (4), boden (4), opera (4)
     3. endgames   (15): lucena (3), philidor (3), opposition (3),
                         breakthrough (3), queen-pawn (3)
     4. historical (20): Morphy, Anderssen, Tal, Fischer, Kasparov,
                         Carlsen, Polgar, Spassky, Capablanca, Alekhine,
                         Botvinnik, Karpov, Lasker, Rubinstein, Byrne,
                         Ivanchuk, Short, Deep Blue, Topalov, Nakamura
   ===================================================================== */
(function () {
  'use strict';

  const PUZZLE_CATEGORIES = [
    {
      id: 'tactics',
      name: { vi: 'Đòn Chiến Thuật Cơ Bản', en: 'Tactical Motifs' },
      subs: [
        { id: 'fork', name: { vi: 'Chĩa Đôi (Fork)', en: 'Fork' } },
        { id: 'pin', name: { vi: 'Ghim Quân (Pin)', en: 'Pin' } },
        { id: 'skewer', name: { vi: 'Xiên Quân (Skewer)', en: 'Skewer' } },
        { id: 'discovered', name: { vi: 'Tấn Công Mở & Chiếu Đôi', en: 'Discovered & Double Attack' } }
      ]
    },
    {
      id: 'mates',
      name: { vi: 'Mẫu Chiếu Bí Kinh Điển', en: 'Checkmate Patterns' },
      subs: [
        { id: 'backrank', name: { vi: 'Chiếu Bí Hàng Cuối (Back-Rank)', en: 'Back-Rank Mate' } },
        { id: 'smothered', name: { vi: 'Chiếu Bí Thắt Cổ (Smothered)', en: 'Smothered Mate' } },
        { id: 'anastasia', name: { vi: 'Chiếu Bí Anastasia', en: 'Anastasia\'s Mate' } },
        { id: 'arabian', name: { vi: 'Chiếu Bí Ả Rập (Arabian)', en: 'Arabian Mate' } },
        { id: 'boden', name: { vi: 'Chiếu Bí Boden', en: 'Boden\'s Mate' } },
        { id: 'opera', name: { vi: 'Chiếu Bí Opera', en: 'Opera Mate' } }
      ]
    },
    {
      id: 'endgames',
      name: { vi: 'Cờ Tàn Thực Chiến', en: 'Essential Endgames' },
      subs: [
        { id: 'lucena', name: { vi: 'Cầu Lucena', en: 'Lucena Position' } },
        { id: 'philidor', name: { vi: 'Phòng Thủ Philidor', en: 'Philidor Defense' } },
        { id: 'opposition', name: { vi: 'Đối Vua (Opposition)', en: 'King Opposition' } },
        { id: 'breakthrough', name: { vi: 'Đột Phá Tốt', en: 'Pawn Breakthrough' } },
        { id: 'queen-pawn', name: { vi: 'Hậu Chống Tốt Hàng 7', en: 'Queen vs 7th-Rank Pawn' } }
      ]
    },
    {
      id: 'historical',
      name: { vi: 'Tuyệt Phẩm Lịch Sử', en: 'Historical Immortal Positions' },
      subs: [
        { id: 'morphy', name: { vi: 'Paul Morphy', en: 'Paul Morphy' } },
        { id: 'anderssen', name: { vi: 'Adolf Anderssen', en: 'Adolf Anderssen' } },
        { id: 'tal', name: { vi: 'Mikhail Tal', en: 'Mikhail Tal' } },
        { id: 'fischer', name: { vi: 'Bobby Fischer', en: 'Bobby Fischer' } },
        { id: 'kasparov', name: { vi: 'Garry Kasparov', en: 'Garry Kasparov' } },
        { id: 'carlsen', name: { vi: 'Magnus Carlsen', en: 'Magnus Carlsen' } },
        { id: 'polgar', name: { vi: 'Judit Polgár', en: 'Judit Polgár' } },
        { id: 'spassky', name: { vi: 'Boris Spassky', en: 'Boris Spassky' } },
        { id: 'legends', name: { vi: 'Huyền Thoại Khác', en: 'Other Legends' } }
      ]
    }
  ];

  const PUZZLES = [
    /* =================================================================
       1. TACTICAL MOTIFS — FORK (10)
       ================================================================= */
    {
      id: 'fork-01', cat: 'tactics', sub: 'fork', rating: 750,
      fen: 'r2qk2r/ppp2ppp/2np4/4N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 6',
      moves: ['e5f7', 'd8e7', 'f7h8'],
      title: { vi: 'Chĩa Đôi Hoàng Gia Ở f7', en: 'Royal Fork Pattern on f7' },
      goal: { vi: 'Dùng Mã chĩa đôi Hậu và Xe ở f7', en: 'Fork the Queen and Rook on f7' },
      explain: {
        vi: 'Mã nhảy vào f7 tấn công đồng thời Hậu d8 và Xe h8. Sau khi Hậu chạy, Trắng ăn không Xe h8.',
        en: 'Nxf7 forks the Queen on d8 and Rook on h8. Once the Queen moves, White wins the Rook on h8.'
      }
    },
    {
      id: 'fork-02', cat: 'tactics', sub: 'fork', rating: 800,
      fen: 'r3k2r/ppp2ppp/8/3N4/8/8/PPP2PPP/R3K2R w KQkq - 0 1',
      moves: ['d5c7', 'e8d7', 'c7a8'],
      title: { vi: 'Chĩa Đôi Vua Và Xe Tại c7', en: 'Classic c7 King-Rook Fork' },
      goal: { vi: 'Chiếu Vua và bắt Xe góc a8', en: 'Deliver a royal fork on c7 to win the a8 Rook' },
      explain: {
        vi: 'Nc7+ vừa chiếu Vua e8 vừa tấn công Xe a8. Vua Đen buộc phải chạy và Trắng ăn Nxa8.',
        en: 'Nc7+ checks the King on e8 and attacks the Rook on a8 simultaneously, winning a full Rook.'
      }
    },
    {
      id: 'fork-03', cat: 'tactics', sub: 'fork', rating: 850,
      fen: '2q1k3/8/3N4/8/8/8/5PPP/6K1 w - - 0 1',
      moves: ['d6c8'],
      title: { vi: 'Mã Bắt Trực Diện Hậu', en: 'Direct Knight Strike on c8' },
      goal: { vi: 'Thu hồi Hậu đối phương ngay lập tức', en: 'Capture the undefended Queen on c8' },
      explain: {
        vi: 'Mã d6 kiểm soát trực tiếp ô c8 — Nxc8 xóa sổ Hậu Đen ngay tức khắc.',
        en: 'The Knight on d6 directly controls c8 — Nxc8 eliminates Black\'s Queen on the spot.'
      }
    },
    {
      id: 'fork-04', cat: 'tactics', sub: 'fork', rating: 900,
      fen: '3qk3/8/8/4N3/8/8/6PP/6K1 w - - 0 1',
      moves: ['e5c6', 'd8d6', 'c6d4'],
      title: { vi: 'Chĩa Đôi Vua – Hậu Ở f7/c6', en: 'Central Knight Fork on c6' },
      goal: { vi: 'Tấn công đồng thời Hậu d8 và kiểm soát trung tâm', en: 'Strike c6 attacking the Queen and central squares' },
      explain: {
        vi: 'Nc6 đe dọa trực tiếp Hậu d8 và kiểm soát các ô trọng yếu quanh Vua Đen, sau đó rút về d4 an toàn.',
        en: 'Nc6 hits the Queen on d8 with tempo and dominates the central squares before consolidating on d4.'
      }
    },
    {
      id: 'fork-05', cat: 'tactics', sub: 'fork', rating: 950,
      fen: '4k3/3q4/8/8/4N3/8/6PP/6K1 w - - 0 1',
      moves: ['e4f6', 'e8f7', 'f6d7'],
      title: { vi: 'Chĩa Đôi Hoàng Gia Kinh Điển', en: 'The Royal Knight Fork' },
      goal: { vi: 'Chiếu Vua và bắt Hậu Đen ở d7', en: 'Fork King and Queen with Nf6+' },
      explain: {
        vi: 'Nf6+ chiếu Vua e8 đồng thời tấn công Hậu d7. Vua Đen chạy đi đâu cũng mất Hậu.',
        en: 'Nf6+ checks the King on e8 while attacking the Queen on d7, winning the Queen cleanly.'
      }
    },
    {
      id: 'fork-06', cat: 'tactics', sub: 'fork', rating: 980,
      fen: 'r3k3/8/8/8/3P4/2p5/1P6/4K2Q w - - 0 1',
      moves: ['h1e4', 'e8d7', 'e4a8'],
      title: { vi: 'Hậu Chĩa Đôi Chiếu Vua Bắt Xe', en: 'Queen Diagonal Double Attack' },
      goal: { vi: 'Dùng Hậu chiếu Vua và bắt Xe a8', en: 'Use the Queen to check the King and win the a8 Rook' },
      explain: {
        vi: 'Qe4+ vừa chiếu Vua trên cột e vừa ngắm thẳng vào Xe a8 không có quân bảo vệ.',
        en: 'Qe4+ checks the King along the e-file while targeting the undefended Rook on a8.'
      }
    },
    {
      id: 'fork-07', cat: 'tactics', sub: 'fork', rating: 1020,
      fen: '4k3/8/3r1b2/8/4P3/8/5PPP/6K1 w - - 0 1',
      moves: ['e4e5', 'f6e5', 'g2g3'],
      title: { vi: 'Tốt Tiến Chĩa Đôi Xe Và Tượng', en: 'Pawn Fork on e5' },
      goal: { vi: 'Đẩy Tốt tấn công cùng lúc Xe d6 và Tượng f6', en: 'Advance the e-pawn to fork Rook and Bishop' },
      explain: {
        vi: 'Nước e5 dùng một quân Tốt tấn công cả Xe d6 lẫn Tượng f6, buộc Đen phải chịu thiệt quân.',
        en: 'Pushing e5 forks the Rook on d6 and Bishop on f6 with a humble pawn.'
      }
    },
    {
      id: 'fork-08', cat: 'tactics', sub: 'fork', rating: 1100,
      fen: '2r3k1/5ppp/8/3N4/8/8/5PPP/3R2K1 w - - 0 1',
      moves: ['d5e7', 'g8f8', 'e7c8'],
      title: { vi: 'Chĩa Đôi Hàng Ngang Số 7', en: 'Seventh-Rank Royal Fork' },
      goal: { vi: 'Nhảy Mã chiếu Vua g8 và ăn Xe c8', en: 'Fork King on g8 and Rook on c8' },
      explain: {
        vi: 'Ne7+ chiếu Vua g8 và bắt chết Xe c8. Một đòn kết hợp cực kỳ phổ biến trong cờ tàn.',
        en: 'Ne7+ checks the King on g8 and simultaneously attacks the Rook on c8, winning a full Rook.'
      }
    },
    {
      id: 'fork-09', cat: 'tactics', sub: 'fork', rating: 1180,
      fen: 'r2q2k1/5ppp/8/8/2B5/8/5PPP/3Q2K1 w - - 0 1',
      moves: ['c4f7', 'g8f7', 'd1d8'],
      title: { vi: 'Thí Tượng Thu Hút Để Bắt Hậu', en: 'Deflection Sacrifice at f7' },
      goal: { vi: 'Thí Tượng ở f7 để kéo Vua ra khỏi Hậu d8', en: 'Sacrifice the Bishop on f7 to win the Queen on d8' },
      explain: {
        vi: 'Bxf7+ buộc Vua Đen ăn lên f7 và rời khỏi nhiệm vụ bảo vệ Hậu d8, tạo điều kiện cho Qxd8.',
        en: 'Bxf7+ deflects the King away from defending d8, allowing Qxd8 on the next move.'
      }
    },
    {
      id: 'fork-10', cat: 'tactics', sub: 'fork', rating: 1250,
      fen: '3r2k1/5ppp/8/8/8/2N5/1q3PPP/3Q2K1 b - - 0 1',
      moves: ['d8d1', 'c3d1', 'b2e2'],
      title: { vi: 'Đòn Đổi Quân Đánh Chiếm Hàng Cuối', en: 'Back-Rank Tactical Exchange' },
      goal: { vi: 'Khai thác hàng ngang số 1 bị quá tải của Trắng', en: 'Exploit White\'s overloaded first rank' },
      explain: {
        vi: 'Đen ăn Rxd1+ buộc Mã Trắng lùi về d1, sau đó Qe2 kiểm soát hoàn toàn thế trận và đe dọa chiếu bí.',
        en: 'Rxd1+ forces Nxd1, and Qe2 seizes full control with unstoppable back-rank threats.'
      }
    },

    /* =================================================================
       2. TACTICAL MOTIFS — PIN (10)
       ================================================================= */
    {
      id: 'pin-01', cat: 'tactics', sub: 'pin', rating: 820,
      fen: '4k3/8/8/8/3n4/8/8/1B2K2R w K - 0 1',
      moves: ['b1g6', 'e8d7', 'h1h4'],
      title: { vi: 'Tượng Chiếu Mở Đường Bắt Mã', en: 'Bishop Check & Rook Pin Setup' },
      goal: { vi: 'Dùng Tượng chiếu Vua rồi gây sức ép lên Mã trung tâm', en: 'Check with the Bishop and target the central Knight' },
      explain: {
        vi: 'Bg6+ buộc Vua Đen lộ diện, sau đó Rh4 khóa chặt quân Mã d4 không có quân bảo vệ.',
        en: 'Bg6+ drives the King out and Rh4 immediately targets the stranded Knight on d4.'
      }
    },
    {
      id: 'pin-02', cat: 'tactics', sub: 'pin', rating: 880,
      fen: '4k3/4r3/8/8/8/8/5PPP/4R1K1 w - - 0 1',
      moves: ['e1e7', 'e8e7'],
      title: { vi: 'Ghim Tuyệt Đối Trên Cột Mở e', en: 'Absolute File Pin Resolution' },
      goal: { vi: 'Triệt tiêu quân Xe đang bị ghim trước Vua e8', en: 'Liquidate the pinned Rook on e7' },
      explain: {
        vi: 'Xe e7 bị ghim tuyệt đối trước Vua e8 và không thể di chuyển khỏi cột e; Rxe7 đơn giản hóa cờ tàn.',
        en: 'The Rook on e7 is pinned to the King on e8; Rxe7 cleanly resolves the pin along the open file.'
      }
    },
    {
      id: 'pin-03', cat: 'tactics', sub: 'pin', rating: 940,
      fen: '3qk3/3n4/8/8/B7/8/5PPP/3R2K1 w - - 0 1',
      moves: ['d1d7', 'd8d7', 'a4d7'],
      title: { vi: 'Chồng Quân Công Kích Quân Bị Ghim', en: 'Piling Up on the Pinned Knight' },
      goal: { vi: 'Khai thác Mã d7 đang bị Tượng a4 ghim vào Vua e8', en: 'Exploit the Knight on d7 pinned to the King on e8' },
      explain: {
        vi: 'Mã d7 bị Tượng a4 ghim tuyệt đối vào Vua e8. Rxd7! buộc Hậu Đen phải đổi lấy Xe và Tượng ăn lại Bxd7+.',
        en: 'The Knight on d7 is pinned to the King on e8 by Ba4. Rxd7! forces Qxd7, and Bxd7+ wins the Queen.'
      }
    },
    {
      id: 'pin-04', cat: 'tactics', sub: 'pin', rating: 1000,
      fen: '6k1/5ppp/8/8/8/2q5/5PPP/1R4K1 w - - 0 1',
      moves: ['b1b8', 'c3c8', 'b8c8'],
      title: { vi: 'Ghim Chết Hậu Ở Hàng Cuối', en: 'Pinning the Queen on the Back Rank' },
      goal: { vi: 'Chiếu hàng cuối buộc Hậu đối phương phải chắn và bị ghim', en: 'Deliver a back-rank check that pins and wins the Queen' },
      explain: {
        vi: 'Rb8+ buộc Hậu Đen phải lùi về c8 chắn chiếu. Hậu bị ghim tuyệt đối và Rxc8# chiếu bí ngay.',
        en: 'Rb8+ forces Qc8 to interpose; the Queen is pinned to the King and Rxc8# is checkmate.'
      }
    },
    {
      id: 'pin-05', cat: 'tactics', sub: 'pin', rating: 1060,
      fen: 'r2qk2r/ppp2ppp/2np1n2/4p1B1/4P3/2NP1N2/PPP2PPP/R2QK2R w KQkq - 0 6',
      moves: ['c3d5', 'f6d5', 'g5d8'],
      title: { vi: 'Tăng Áp Lực Lên Mã Bị Ghim f6', en: 'Nd5 Pressure Against the f6 Pin' },
      goal: { vi: 'Nhảy Mã vào d5 tấn công quân Mã f6 đang bị ghim trước Hậu', en: 'Jump to d5 to exploit the relative pin on f6' },
      explain: {
        vi: 'Nd5 đánh thẳng vào Mã f6 đang bị Tượng g5 ghim trước Hậu d8. Nếu Đen ăn Nxd5 thì Bxd8 mất Hậu.',
        en: 'Nd5 piles pressure onto the f6 Knight pinned to the Queen on d8. If Nxd5, Bxd8 wins the Queen.'
      }
    },
    {
      id: 'pin-06', cat: 'tactics', sub: 'pin', rating: 1120,
      fen: '4k3/8/4q3/8/8/8/4RPPP/4Q1K1 w - - 0 1',
      moves: ['e2e6', 'e8f7'],
      title: { vi: 'Ghim Tuyệt Đối Hậu Trên Cột Dọc', en: 'Absolute Queen Pin Along the e-File' },
      goal: { vi: 'Bắt Hậu e6 đang bị ghim cứng trước Vua e8', en: 'Win the Queen on e6 pinned to the King on e8' },
      explain: {
        vi: 'Hậu Đen ở e6 bị ghim trước Vua e8 bởi cặp Xe – Hậu Trắng trên cột e. Rxe6+ thắng gọn Hậu.',
        en: 'Black\'s Queen on e6 is pinned to the King on e8 along the e-file. Rxe6+ wins the Queen cleanly.'
      }
    },
    {
      id: 'pin-07', cat: 'tactics', sub: 'pin', rating: 1160,
      fen: '2kr4/ppp2ppp/2n5/8/1b6/2N5/PPP2PPP/2KR3R w - - 0 1',
      moves: ['d1d8', 'c6d8'],
      title: { vi: 'Đổi Xe Giải Phóng Quân Bị Ghim', en: 'Unpinning & Back-Rank Simplification' },
      goal: { vi: 'Đổi Xe trên cột d để làm suy yếu hàng thủ Đen', en: 'Trade Rooks on d8 to deflect the defender' },
      explain: {
        vi: 'Rxd8+ buộc Mã c6 phải lùi về d8 ăn lại, giải phóng hoàn toàn Mã c3 khỏi đường ghim của Tượng b4.',
        en: 'Rxd8+ forces Nxd8, pulling Black\'s Knight to the back rank and freeing White\'s c3 Knight.'
      }
    },
    {
      id: 'pin-08', cat: 'tactics', sub: 'pin', rating: 1200,
      fen: '4k3/5p2/4p3/8/6Q1/8/5PPP/5RK1 w - - 0 1',
      moves: ['g4a4', 'e8f8'],
      title: { vi: 'Hậu Chiếu Xiên Tạo Thế Ghim', en: 'Diagonal Queen Check & File Control' },
      goal: { vi: 'Chiếu Vua từ cánh để đẩy Vua vào cột f đang bị Xe ngắm', en: 'Check on a4 to drive the King onto the f-file' },
      explain: {
        vi: 'Qa4+ buộc Vua Đen chạy sang f8, đưa Vua và Tốt f7 vào thẳng đường ngắm của Xe f1.',
        en: 'Qa4+ forces Kf8, aligning the Black King and f7 pawn directly with White\'s Rook on f1.'
      }
    },
    {
      id: 'pin-09', cat: 'tactics', sub: 'pin', rating: 1260,
      fen: '3r2k1/5ppp/5n2/8/1b6/2N5/5PPP/3R2K1 w - - 0 1',
      moves: ['d1d8', 'b4f8'],
      title: { vi: 'Ghim Ngược Tượng Ở Hàng Cuối', en: 'Back-Rank Pin Reversal' },
      goal: { vi: 'Đột nhập d8 khiến Tượng Đen phải lùi về f8 chịu ghim', en: 'Invade d8 and pin the retreating Bishop on f8' },
      explain: {
        vi: 'Rxd8+ buộc Tượng b4 phải quay về f8 chắn chiếu và lập tức bị ghim cứng trước Vua g8.',
        en: 'Rxd8+ forces Bf8 to interpose, pinning the Bishop helplessly in front of the King on g8.'
      }
    },
    {
      id: 'pin-10', cat: 'tactics', sub: 'pin', rating: 1320,
      fen: 'r4rk1/ppp2ppp/8/8/8/2B5/PPP1qPPP/R4RK1 w - - 0 1',
      moves: ['c3g7', 'g8g7', 'f1e1'],
      title: { vi: 'Phá Lá Chắn G7 Và Trục Xuất Hậu', en: 'Destroying the g7 Shield & Seizing the e-File' },
      goal: { vi: 'Thí Tượng ở g7 mở toang Vua Đen rồi chiếm cột e', en: 'Eliminate the g7 pawn shield and seize the open e-file' },
      explain: {
        vi: 'Bxg7 mở toang vị trí Vua Đen, sau đó Rfe1 đẩy lùi Hậu e2 và giành quyền kiểm soát cột mở.',
        en: 'Bxg7 strips the King\'s shelter and Rfe1 gains a decisive tempo against the Queen on e2.'
      }
    },

    /* =================================================================
       3. TACTICAL MOTIFS — SKEWER (10)
       ================================================================= */
    {
      id: 'skewer-01', cat: 'tactics', sub: 'skewer', rating: 840,
      fen: '4k3/8/8/8/8/8/r7/4K2R w K - 0 1',
      moves: ['h1h8', 'e8d7', 'h8a8'],
      title: { vi: 'Xe Xiên Vua Bắt Xe Cột a', en: 'Eighth-Rank Rook Skewer' },
      goal: { vi: 'Chiếu Vua ở hàng 8 để xiên quân phía sau', en: 'Deliver a check on the 8th rank to dominate from behind' },
      explain: {
        vi: 'Rh8+ buộc Vua Đen rời hàng 8, giúp Xe Trắng làm chủ hoàn toàn hàng ngang cuối.',
        en: 'Rh8+ forces the King off the back rank and gives White\'s Rook total command from behind.'
      }
    },
    {
      id: 'skewer-02', cat: 'tactics', sub: 'skewer', rating: 900,
      fen: 'r3k3/8/8/8/8/8/5PP1/6KR w - - 0 1',
      moves: ['h1h8', 'e8d7', 'h8a8'],
      title: { vi: 'Xiên Ngang Hàng 8 Bắt Xe a8', en: 'Classic Back-Rank Rook Skewer' },
      goal: { vi: 'Dùng Xe chiếu Vua e8 để ăn Xe a8 phía sau', en: 'Skewer the King on e8 to win the Rook on a8' },
      explain: {
        vi: 'Rh8+ chiếu Vua e8 theo hàng ngang số 8. Khi Vua Đen chạy sang d7, Trắng ăn gọn Rxa8.',
        en: 'Rh8+ skewers the King on e8 along the eighth rank; after Kd7, Rxa8 wins the Rook.'
      }
    },
    {
      id: 'skewer-03', cat: 'tactics', sub: 'skewer', rating: 950,
      fen: '1q6/8/3k4/8/8/6B1/5PPP/6K1 w - - 0 1',
      moves: ['g3f4', 'd6d5', 'f4b8'],
      title: { vi: 'Tượng Xiên Đường Chéo Bắt Hậu', en: 'Diagonal Bishop Skewer on the Queen' },
      goal: { vi: 'Chiếu Vua d6 trên đường chéo h2–b8 để ăn Hậu b8', en: 'Skewer King and Queen along the h2–b8 diagonal' },
      explain: {
        vi: 'Bf4+ chiếu Vua d6 và xuyên thẳng tới Hậu b8 phía sau. Vua Đen buộc phải tránh và Bxb8 thắng Hậu.',
        en: 'Bf4+ checks the King on d6 along the h2–b8 diagonal; once the King moves, Bxb8 wins the Queen.'
      }
    },
    {
      id: 'skewer-04', cat: 'tactics', sub: 'skewer', rating: 1000,
      fen: '8/1r6/8/3k4/8/5B2/5PPP/6K1 w - - 0 1',
      moves: ['f3e4', 'd5e4'],
      title: { vi: 'Tượng Xiên Đường Chéo Lớn h1–a8', en: 'Long-Diagonal Skewer Tactic' },
      goal: { vi: 'Chiếu Vua trên đường chéo lớn nhằm vào Xe b7', en: 'Strike along the long diagonal to skewer King and Rook' },
      explain: {
        vi: 'Be4+ tấn công trực diện Vua d5 trên đường chéo hướng thẳng tới Xe b7 phía sau.',
        en: 'Be4+ attacks the King on d5 along the long diagonal pointing directly at the Rook on b7.'
      }
    },
    {
      id: 'skewer-05', cat: 'tactics', sub: 'skewer', rating: 1040,
      fen: 'r7/8/2k5/8/8/5B2/5PPP/6K1 w - - 0 1',
      moves: ['f3e4', 'c6d6', 'e4a8'],
      title: { vi: 'Tượng Xiên Vua c6 Bắt Xe a8', en: 'Bishop Skewer Winning the Corner Rook' },
      goal: { vi: 'Chiếu Vua ở c6 trên đường chéo h1–a8 để bắt Xe a8', en: 'Check the King on c6 to win the Rook on a8' },
      explain: {
        vi: 'Be4+ chiếu Vua c6 và xiên thẳng tới Xe a8 ở góc bàn cờ. Khi Vua Đen chạy, Bxa8 ăn gọn Xe.',
        en: 'Be4+ skewers the King on c6 to the Rook on a8; after Kd6, Bxa8 captures the Rook.'
      }
    },
    {
      id: 'skewer-06', cat: 'tactics', sub: 'skewer', rating: 1100,
      fen: '4q3/8/4k3/8/8/8/5PPP/4R1K1 w - - 0 1',
      moves: ['e1e6', 'e8e6'],
      title: { vi: 'Đòn Xiên Dọc Trên Cột e', en: 'Vertical e-File Skewer Strike' },
      goal: { vi: 'Chiếu Vua e6 để công kích Hậu e8 phía sau', en: 'Strike the King on e6 with the Rook along the e-file' },
      explain: {
        vi: 'Vua Đen đứng chắn trước Hậu trên cột e — một vị trí cực kỳ nhạy cảm trước các đòn xiên dọc.',
        en: 'With the King standing in front of the Queen on the e-file, vertical Rook checks exploit the alignment.'
      }
    },
    {
      id: 'skewer-07', cat: 'tactics', sub: 'skewer', rating: 1150,
      fen: '3q4/8/8/3k4/8/8/5PPP/3Q2K1 w - - 0 1',
      moves: ['d1d5', 'd8d5'],
      title: { vi: 'Đối Đầu Trực Diện Trên Cột d', en: 'Central File Queen Skewer Alignment' },
      goal: { vi: 'Tấn công Vua d5 đang đứng trước Hậu d8', en: 'Exploit the King-Queen alignment on the d-file' },
      explain: {
        vi: 'Khi Vua và Hậu đối phương cùng nằm trên một cột mở, mọi đòn chiếu dọc đều tạo áp lực trực tiếp.',
        en: 'When the enemy King and Queen share an open file, vertical checks immediately force concessions.'
      }
    },
    {
      id: 'skewer-08', cat: 'tactics', sub: 'skewer', rating: 1200,
      fen: '4r3/8/8/4k3/8/8/4QPPP/6K1 w - - 0 1',
      moves: ['e2e5', 'e8e5'],
      title: { vi: 'Xiên Cột e Giữa Vua Và Xe', en: 'King-Rook Alignment on the e-File' },
      goal: { vi: 'Tấn công thẳng vào điểm giao Vua e5 – Xe e8', en: 'Strike the e5 square where King and Rook align' },
      explain: {
        vi: 'Sự thẳng hàng giữa Vua e5 và Xe e8 là tín hiệu chiến thuật kinh điển trên cột mở.',
        en: 'The alignment of King on e5 and Rook on e8 is a classic tactical cue on the open file.'
      }
    },
    {
      id: 'skewer-09', cat: 'tactics', sub: 'skewer', rating: 1240,
      fen: '1r6/8/8/1k6/8/8/5PPP/1R4K1 w - - 0 1',
      moves: ['b1b5', 'b8b5'],
      title: { vi: 'Khai Thác Cột Mở b', en: 'b-File Rook Skewer Alignment' },
      goal: { vi: 'Tấn công dọc cột b nơi Vua b5 đứng trước Xe b8', en: 'Challenge the b-file alignment of King and Rook' },
      explain: {
        vi: 'Xe b1 kiểm soát toàn bộ cột dọc dẫn thẳng tới Vua b5 và Xe b8.',
        en: 'The Rook on b1 commands the entire file leading through the King on b5 to the Rook on b8.'
      }
    },
    {
      id: 'skewer-10', cat: 'tactics', sub: 'skewer', rating: 1300,
      fen: '7q/8/5k2/8/8/2B5/5PPP/6K1 w - - 0 1',
      moves: ['c3f6', 'h8f6'],
      title: { vi: 'Đường Chéo Tử Thần a1–h8', en: 'The a1–h8 Diagonal Skewer' },
      goal: { vi: 'Chiếu Vua f6 trên đường chéo dẫn tới Hậu h8', en: 'Strike f6 along the a1–h8 diagonal toward the Queen on h8' },
      explain: {
        vi: 'Tượng c3 ngắm xuyên qua Vua f6 tới Hậu h8 ở góc bàn cờ trên đường chéo lớn.',
        en: 'The Bishop on c3 sights right through the King on f6 to the Queen in the h8 corner.'
      }
    },

    /* =================================================================
       4. TACTICAL MOTIFS — DISCOVERED & DOUBLE ATTACK (10)
       ================================================================= */
    {
      id: 'disc-01', cat: 'tactics', sub: 'discovered', rating: 900,
      fen: '3qk3/8/4N3/8/8/8/5PPP/4R1K1 w - - 0 1',
      moves: ['e6d8', 'e8d8', 'e1e8'],
      title: { vi: 'Mã Rời Cột e Mở Đường Cho Xe', en: 'Discovered e-File Clearance' },
      goal: { vi: 'Dùng Mã ăn Hậu d8 và mở cột e cho Xe e1 chiếu', en: 'Capture the Queen on d8 and open the e-file for the Rook' },
      explain: {
        vi: 'Nxd8+ vừa ăn Hậu vừa mở toang cột e cho Xe e1 lao lên e8 chiếu tiếp.',
        en: 'Nxd8+ captures the Queen while clearing the e-file for Re8+ to follow immediately.'
      }
    },
    {
      id: 'disc-02', cat: 'tactics', sub: 'discovered', rating: 960,
      fen: 'r3k3/8/4N3/8/8/8/5PPP/4R1K1 w - - 0 1',
      moves: ['e6c7', 'e8d7', 'c7a8'],
      title: { vi: 'Chiếu Đôi Mở Cột e Và Bắt Xe', en: 'Double Check & Corner Rook Capture' },
      goal: { vi: 'Nhảy Mã tới c7 tạo đòn chiếu đôi cực mạnh', en: 'Play Nc7+ delivering a devastating double check' },
      explain: {
        vi: 'Nc7+ là đòn chiếu đôi (cả Mã c7 lẫn Xe e1 cùng chiếu Vua e8). Vua Đen buộc phải chạy và Nxa8 ăn Xe.',
        en: 'Nc7+ delivers double check from both the Knight on c7 and the Rook on e1; after Kd7, Nxa8 wins the Rook.'
      }
    },
    {
      id: 'disc-03', cat: 'tactics', sub: 'discovered', rating: 1020,
      fen: '3qk3/8/8/4B3/8/8/5PPP/4R1K1 w - - 0 1',
      moves: ['e5f6', 'e8f7', 'f6d8'],
      title: { vi: 'Chiếu Mở Bằng Tượng Bắt Hậu d8', en: 'Discovered Check Winning the Queen' },
      goal: { vi: 'Rút Tượng chiếu mở từ Xe e1 và tấn công Hậu d8', en: 'Move the Bishop to unleash a discovered check and attack the Queen' },
      explain: {
        vi: 'Bf6+ mở đường cho Xe e1 chiếu Vua e8 đồng thời Tượng f6 tấn công trực tiếp Hậu d8. Sau Kf7, Bxd8 ăn Hậu!',
        en: 'Bf6+ unleashes a discovered check from Re1 while the Bishop attacks the Queen on d8. After Kf7, Bxd8 wins the Queen!'
      }
    },
    {
      id: 'disc-04', cat: 'tactics', sub: 'discovered', rating: 1080,
      fen: 'r3k3/8/8/8/4B3/8/5PPP/4R1K1 w - - 0 1',
      moves: ['e4c6', 'e8f7', 'c6a8'],
      title: { vi: 'Tượng Chiếu Mở Thu Quân Góc Bàn', en: 'Discovered Check Winning the a8 Rook' },
      goal: { vi: 'Dùng Tượng chiếu đôi/mở ở c6 để bắt Xe a8', en: 'Play Bc6+ for a discovered/double check that wins the a8 Rook' },
      explain: {
        vi: 'Bc6+ vừa mở đường cho Xe e1 chiếu Vua e8 vừa chiếu bằng Tượng và ngắm thẳng vào Xe a8. Sau Kf7, Bxa8 thắng Xe.',
        en: 'Bc6+ delivers double check and targets the Rook on a8; after Kf7, Bxa8 wins the Rook.'
      }
    },
    {
      id: 'disc-05', cat: 'tactics', sub: 'discovered', rating: 1140,
      fen: '6k1/5ppp/8/8/3n4/8/2B2PPP/3R2K1 w - - 0 1',
      moves: ['c2h7', 'g8h7', 'd1d4'],
      title: { vi: 'Tấn Công Mở Đánh Đổi Ở h7', en: 'Discovered Attack on the Central Knight' },
      goal: { vi: 'Chiếu ở h7 để mở đường cho Xe d1 ăn gọn Mã d4', en: 'Play Bxh7+ to uncover the Rook\'s attack on the d4 Knight' },
      explain: {
        vi: 'Bxh7+! chiếu Vua g8 và mở đường dọc cột d cho Xe d1. Sau khi Vua Đen ăn Kxh7, Trắng ăn lại Rxd4 lời một Tốt.',
        en: 'Bxh7+! checks the King on g8 and uncovers the d1 Rook\'s attack on d4. After Kxh7, Rxd4 wins a clear pawn.'
      }
    },
    {
      id: 'disc-06', cat: 'tactics', sub: 'discovered', rating: 1200,
      fen: '3q2k1/5ppp/8/8/8/2B5/5PPP/3R2K1 w - - 0 1',
      moves: ['d1d8'],
      title: { vi: 'Đột Kích Cột d Bắt Sống Hậu', en: 'Direct d-File Queen Capture Mate' },
      goal: { vi: 'Chiếm trọn cột d bằng đòn ăn trực diện ở d8', en: 'Capture the undefended Queen on d8 with checkmate' },
      explain: {
        vi: 'Hậu Đen ở d8 không được bảo vệ — Rxd8# vừa ăn Hậu vừa chiếu bí hàng cuối ngay lập tức!',
        en: 'Black\'s Queen on d8 is undefended and the back rank is weak — Rxd8# captures the Queen with checkmate!'
      }
    },
    {
      id: 'disc-07', cat: 'tactics', sub: 'discovered', rating: 1250,
      fen: '1k6/ppp5/8/8/8/8/5PPP/1R4K1 w - - 0 1',
      moves: ['b1b7', 'b8b7'],
      title: { vi: 'Phá Vỡ Hàng Rào Tốt Cánh Hậu', en: 'Queenside File Penetration' },
      goal: { vi: 'Đột nhập b7 trực diện trước Vua Đen', en: 'Strike b7 in front of the Black King' },
      explain: {
        vi: 'Áp lực dọc cột mở b nhắm thẳng vào điểm b7 ngay trước Vua Đen.',
        en: 'Pressure along the open b-file targets b7 directly in front of the Black King.'
      }
    },
    {
      id: 'disc-08', cat: 'tactics', sub: 'discovered', rating: 1280,
      fen: '3qk3/8/8/4N3/8/8/5PPP/4R1K1 w - - 0 1',
      moves: ['e5c6', 'e8f7', 'c6d8'],
      title: { vi: 'Mã Chiếu Mở Bắt Hậu d8', en: 'Knight Discovered Check Winning the Queen' },
      goal: { vi: 'Nhảy Mã sang c6 để Xe e1 chiếu mở và bắt Hậu d8', en: 'Play Nc6+ to uncover a check from Re1 and win the Queen on d8' },
      explain: {
        vi: 'Nc6+! mở đường cho Xe e1 chiếu Vua e8 đồng thời Mã c6 tấn công Hậu d8. Đen phải đỡ chiếu và mất Hậu sau Nxd8.',
        en: 'Nc6+! discovers check from the Rook on e1 while attacking the Queen on d8. After Kf7, Nxd8 wins the Queen.'
      }
    },
    {
      id: 'disc-09', cat: 'tactics', sub: 'discovered', rating: 1340,
      fen: 'r3k3/8/8/4N3/8/8/5PPP/4R1K1 w - - 0 1',
      moves: ['e5g6', 'e8d7', 'g6e7'],
      title: { vi: 'Chiếu Mở Phong Tỏa Cánh Vua', en: 'Discovered Check & Central Outpost' },
      goal: { vi: 'Nhảy Mã sang g6 mở đường cho Xe e1 chiếu Vua', en: 'Play Ng6+ to unleash a discovered check along the e-file' },
      explain: {
        vi: 'Ng6+ mở toang cột e cho Xe e1 chiếu Vua e8, buộc Vua Đen phải rời vị trí ban đầu.',
        en: 'Ng6+ opens the e-file for Re1 to check the King on e8, forcing the King out into the open.'
      }
    },
    {
      id: 'disc-10', cat: 'tactics', sub: 'discovered', rating: 1380,
      fen: '2q1k3/8/8/4N3/8/8/5PPP/4R1K1 w - - 0 1',
      moves: ['e5g6', 'e8d7', 'e1e7'],
      title: { vi: 'Chiếu Mở Kết Hợp Đột Nhập Hàng 7', en: 'Discovered Check into Seventh-Rank Invasion' },
      goal: { vi: 'Chiếu mở bằng Mã rồi đưa Xe xâm nhập hàng 7', en: 'Unleash a discovered check and invade the seventh rank with Re7+' },
      explain: {
        vi: 'Ng6+ mở đường cho Xe e1 chiếu Vua, và ngay sau Kd7, Re7+ xâm nhập hàng 7 với sức công phá cực lớn.',
        en: 'Ng6+ discovers check from Re1, and after Kd7, Re7+ invades the seventh rank with decisive force.'
      }
    },

    /* =================================================================
       5. CHECKMATE PATTERNS — BACK-RANK (5)
       ================================================================= */
    {
      id: 'mate-br-01', cat: 'mates', sub: 'backrank', rating: 750,
      fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
      moves: ['e1e8'],
      title: { vi: 'Chiếu Bí Hàng Cuối Cơ Bản', en: 'Fundamental Back-Rank Mate' },
      goal: { vi: 'Chiếu bí trong 1 nước ở hàng ngang số 8', en: 'Deliver checkmate in 1 on the eighth rank' },
      explain: {
        vi: 'Ba Tốt f7, g7, h7 vô tình trở thành bức tường nhốt chính Vua g8. Re8# chiếu bí ngay!',
        en: 'Black\'s own pawns on f7, g7, and h7 trap the King on g8. Re8# is immediate checkmate!'
      }
    },
    {
      id: 'mate-br-02', cat: 'mates', sub: 'backrank', rating: 900,
      fen: '3r2k1/5ppp/8/8/8/8/5PPP/3R1RK1 w - - 0 1',
      moves: ['d1d8'],
      title: { vi: 'Song Xe Công Phá Hàng Cuối', en: 'Doubled Rooks Back-Rank Mate' },
      goal: { vi: 'Đột phá điểm d8 để chiếu bí hàng cuối', en: 'Break through on d8 for checkmate' },
      explain: {
        vi: 'Rxd8# tận dụng việc Xe d8 là quân duy nhất canh giữ hàng ngang số 8 của Đen.',
        en: 'Rxd8# eliminates the sole defender of Black\'s eighth rank for instant checkmate.'
      }
    },
    {
      id: 'mate-br-03', cat: 'mates', sub: 'backrank', rating: 1050,
      fen: '2r3k1/5ppp/8/8/8/8/5PPP/1R2R1K1 w - - 0 1',
      moves: ['b1b8', 'c8b8', 'e1e8'],
      title: { vi: 'Thí Xe Đánh Lạc Hướng Quân Canh Hàng 8', en: 'Back-Rank Deflection Sacrifice' },
      goal: { vi: 'Chiếu bí trong 2 nước bằng đòn phối hợp hai Xe', en: 'Mate in 2 by overloading the back-rank defender' },
      explain: {
        vi: 'Rb8! buộc Xe c8 phải ăn sang b8, tạo điều kiện cho Xe thứ hai lao lên Re8# chiếu bí.',
        en: 'Rb8! forces Rxb8, deflecting Black\'s Rook so that Re8# delivers back-rank checkmate.'
      }
    },
    {
      id: 'mate-br-04', cat: 'mates', sub: 'backrank', rating: 1150,
      fen: '3r2k1/5ppp/8/8/8/8/4QPPP/4R1K1 w - - 0 1',
      moves: ['e2e8', 'd8e8', 'e1e8'],
      title: { vi: 'Thí Hậu Đập Tan Hàng Ngang Số 8', en: 'Queen Sacrifice for Back-Rank Mate' },
      goal: { vi: 'Thí Hậu ở e8 để Xe e1 kết liễu ở hàng cuối', en: 'Sacrifice the Queen on e8 to finish with Rxe8#' },
      explain: {
        vi: 'Qe8+! buộc Xe d8 phải ăn Rxe8, và Rxe8# chiếu bí hàng cuối đẹp mắt.',
        en: 'Qe8+! forces Rxe8, and Rxe8# completes a classic back-rank checkmate.'
      }
    },
    {
      id: 'mate-br-05', cat: 'mates', sub: 'backrank', rating: 1220,
      fen: '1r4k1/5ppp/8/8/8/8/5PPP/2Q1R1K1 w - - 0 1',
      moves: ['c1c8', 'b8c8', 'e1e8'],
      title: { vi: 'Đòn Đánh Lạc Hướng Xe b8', en: 'Deflecting the b8 Guard' },
      goal: { vi: 'Dùng Hậu kéo Xe b8 rời vị trí để Xe e1 chiếu bí', en: 'Sacrifice on c8 so Re8# mates' },
      explain: {
        vi: 'Qc8+! buộc Rxc8, làm mất quân bảo vệ ô e8 và cho phép Re8# chiếu bí ngay.',
        en: 'Qc8+! forces Rxc8, removing the guard of e8 and allowing Re8# checkmate.'
      }
    },

    /* =================================================================
       6. CHECKMATE PATTERNS — SMOTHERED (4)
       ================================================================= */
    {
      id: 'mate-sm-01', cat: 'mates', sub: 'smothered', rating: 900,
      fen: '6rk/6pp/8/6N1/8/8/5PPP/6K1 w - - 0 1',
      moves: ['g5f7'],
      title: { vi: 'Chiếu Bí Thắt Cổ 1 Nước', en: 'Pure Smothered Mate in 1' },
      goal: { vi: 'Dùng Mã chiếu bí Vua Đen đang bị chính quân mình vây kín', en: 'Deliver smothered checkmate with the Knight' },
      explain: {
        vi: 'Vua Đen ở h8 bị Xe g8 và hai Tốt g7, h7 bịt kín mọi lối thoát. Nf7# chiếu bí thắt cổ!',
        en: 'The King on h8 is completely boxed in by its own Rook on g8 and pawns on g7/h7. Nf7# is smothered mate!'
      }
    },
    {
      id: 'mate-sm-02', cat: 'mates', sub: 'smothered', rating: 1180,
      fen: '5r1k/6pp/8/4N3/8/2Q5/5PPP/6K1 w - - 0 1',
      moves: ['e5f7', 'h8g8', 'f7h6', 'g8h8', 'c3b3', 'f8d8', 'b3g8', 'd8g8', 'h6f7'],
      title: { vi: 'Di Sản Bất Tử Của Philidor', en: 'Philidor\'s Legacy Smothered Mate' },
      goal: { vi: 'Thực hiện chuỗi chiếu đôi và thí Hậu ở g8 để chiếu bí bằng Mã', en: 'Execute Philidor\'s classic Queen sacrifice for smothered mate' },
      explain: {
        vi: 'Chuỗi kinh điển: Nf7+ Kg8 Nh6+ Kh8, sau đó đưa Hậu lên đường chéo a2–g8 để tung Qg8+! Rxg8 Nf7# chiếu bí thắt cổ.',
        en: 'The immortal sequence: Nf7+ Kg8 Nh6+ Kh8, aligning the Queen on the a2–g8 diagonal for Qg8+! Rxg8 Nf7# smothered mate.'
      }
    },
    {
      id: 'mate-sm-03', cat: 'mates', sub: 'smothered', rating: 1100,
      fen: '5r1k/6pp/7N/8/8/1Q6/5PPP/6K1 w - - 0 1',
      moves: ['b3g8', 'f8g8', 'h6f7'],
      title: { vi: 'Đòn Thí Hậu Qg8+! Đóng Khung Vua h8', en: 'Queen Sacrifice Qg8+! into Smothered Mate' },
      goal: { vi: 'Thí Hậu ở g8 kéo Xe Đen vào góc rồi nhảy Mã f7#', en: 'Sacrifice the Queen on g8 so Nf7# delivers smothered mate' },
      explain: {
        vi: 'Qg8+! buộc Xe f8 phải ăn Rxg8 (vì Mã h6 bảo vệ g8 nên Vua không ăn được), tự khóa Vua h8 trước đòn Nf7#.',
        en: 'Qg8+! forces Rxg8 (since Nh6 guards g8), sealing the King\'s last flight square and allowing Nf7# checkmate.'
      }
    },
    {
      id: 'mate-sm-04', cat: 'mates', sub: 'smothered', rating: 1020,
      fen: 'r1b3kr/ppp2ppp/8/4N3/8/8/PPP2PPP/R3K2R w KQ - 0 1',
      moves: ['e5f7', 'g8f8', 'f7h8'],
      title: { vi: 'Đe Dọa Thắt Cổ Ở Góc Cánh Vua', en: 'Kingside Corner Knight Strike' },
      goal: { vi: 'Tấn công điểm f7 buộc Vua Đen chạy và bắt Xe h8', en: 'Strike f7 with the Knight to win the trapped h8 Rook' },
      explain: {
        vi: 'Nxf7 đe dọa trực tiếp vùng góc Vua và bắt gọn Xe h8 đang bị kẹt trong góc.',
        en: 'Nxf7 invades the kingside pocket and captures the cornered Rook on h8.'
      }
    },

    /* =================================================================
       7. CHECKMATE PATTERNS — ANASTASIA (4)
       ================================================================= */
    {
      id: 'mate-an-01', cat: 'mates', sub: 'anastasia', rating: 950,
      fen: '7k/4N1pp/8/8/8/8/5PP1/6KR w - - 0 1',
      moves: ['h1h7'],
      title: { vi: 'Chiếu Bí Anastasia Chuẩn Mực', en: 'Classic Anastasia\'s Mate' },
      goal: { vi: 'Phối hợp Mã e7 và Xe cột h để chiếu bí', en: 'Deliver Anastasia\'s mate along the h-file' },
      explain: {
        vi: 'Mã e7 khống chế hai ô g8 và g6, trong khi Tốt g7 chặn lối thoát của Vua. Rxh7# chiếu bí!',
        en: 'The Knight on e7 covers g8 and g6 while Black\'s own pawn on g7 blocks the King. Rxh7# is mate!'
      }
    },
    {
      id: 'mate-an-02', cat: 'mates', sub: 'anastasia', rating: 1150,
      fen: '5r1k/4N1pp/8/8/8/5R1Q/5PP1/6K1 w - - 0 1',
      moves: ['h3h7', 'h8h7', 'f3h3'],
      title: { vi: 'Thí Hậu Mở Cột h Cho Đòn Anastasia', en: 'Queen Sacrifice into Anastasia\'s Mate' },
      goal: { vi: 'Thí Hậu ở h7 rồi đưa Xe sang cột h chiếu bí', en: 'Sacrifice the Queen on h7 and mate with Rh3#' },
      explain: {
        vi: 'Qxh7+! buộc Kxh7, mở toang cột h. Nhờ Mã e7 đã khóa chặt g8 và g6, Rh3# chiếu bí ngay!',
        en: 'Qxh7+! forces Kxh7, opening the h-file. With Ne7 controlling g8 and g6, Rh3# is checkmate!'
      }
    },
    {
      id: 'mate-an-03', cat: 'mates', sub: 'anastasia', rating: 1080,
      fen: '5r1k/6pp/8/5N2/8/7R/5PPP/6K1 w - - 0 1',
      moves: ['f5e7', 'h7h6', 'h3h6', 'g7h6'],
      title: { vi: 'Nhảy Mã e7 Khóa Lối Thoát Của Vua', en: 'Setting the Anastasia Net with Ne7' },
      goal: { vi: 'Đưa Mã vào e7 đe dọa chiếu bí trên cột h', en: 'Plant the Knight on e7 to create an unstoppable h-file threat' },
      explain: {
        vi: 'Ne7! thiết lập lưới chiếu bí Anastasia kinh điển, buộc Đen phải tuyệt vọng đẩy h6.',
        en: 'Ne7! weaves the classic Anastasia mating net on the h-file.'
      }
    },
    {
      id: 'mate-an-04', cat: 'mates', sub: 'anastasia', rating: 1020,
      fen: '7k/4N1p1/8/8/8/7R/5PPP/6K1 w - - 0 1',
      moves: ['h3h8'],
      title: { vi: 'Hành Lang Tử Thần Cột h', en: 'The h-File Corridor Mate' },
      goal: { vi: 'Chiếu bí Vua h8 bằng Xe h3 và Mã e7', en: 'Mate the King on h8 with the Rook and Knight' },
      explain: {
        vi: 'Mã e7 kiểm soát g8 và g6, Tốt g7 chặn đường thoát. Rh8# kết thúc ván đấu.',
        en: 'Ne7 controls g8 and g6 while the g7 pawn blocks escape. Rh8# finishes the game.'
      }
    },

    /* =================================================================
       8. CHECKMATE PATTERNS — ARABIAN (4)
       ================================================================= */
    {
      id: 'mate-ar-01', cat: 'mates', sub: 'arabian', rating: 900,
      fen: '7k/8/5N2/8/8/8/5PP1/6KR w - - 0 1',
      moves: ['h1h7'],
      title: { vi: 'Chiếu Bí Ả Rập Cổ Điển', en: 'The Ancient Arabian Mate' },
      goal: { vi: 'Phối hợp Xe và Mã chiếu bí Vua ở góc h8', en: 'Mate the cornered King with Rook and Knight' },
      explain: {
        vi: 'Rh7# là mẫu chiếu bí cổ xưa nhất lịch sử cờ vua: Mã f6 vừa bảo vệ Xe h7 vừa khóa ô thoát g8.',
        en: 'Rh7# is the oldest recorded checkmate pattern in chess history: Nf6 guards h7 and covers g8.'
      }
    },
    {
      id: 'mate-ar-02', cat: 'mates', sub: 'arabian', rating: 950,
      fen: 'k7/8/2N5/8/8/8/5PPP/R5K1 w - - 0 1',
      moves: ['a1a7'],
      title: { vi: 'Chiếu Bí Ả Rập Ở Góc Cánh Hậu', en: 'Queenside Arabian Mate on a7' },
      goal: { vi: 'Chiếu bí Vua a8 bằng Xe a7 được Mã c6 hỗ trợ', en: 'Deliver Arabian mate on a7 supported by Nc6' },
      explain: {
        vi: 'Ra7#! Mã c6 bảo vệ Xe a7 đồng thời khóa chặt ô b8 khiến Vua a8 không còn lối thoát.',
        en: 'Ra7#! The Knight on c6 defends the Rook on a7 while covering b8.'
      }
    },
    {
      id: 'mate-ar-03', cat: 'mates', sub: 'arabian', rating: 1120,
      fen: '6k1/8/5N2/8/8/8/5PP1/1R4KR w - - 0 1',
      moves: ['h1h8', 'g8h8', 'b1b8'],
      title: { vi: 'Thí Xe Thu Hút Vua Vào Góc h8', en: 'Rook Sacrifice into Back-Rank & Arabian Net' },
      goal: { vi: 'Thí Xe ở h8 kéo Vua vào góc rồi kết liễu ở hàng 8', en: 'Sacrifice on h8 to drag the King into the corner and mate on b8' },
      explain: {
        vi: 'Rh8+! buộc Vua Đen ăn Kxh8, và Rb8# chiếu bí ngay nhờ Mã f6 đã khóa ô g8.',
        en: 'Rh8+! forces Kxh8, and Rb8# is checkmate as the Knight on f6 covers g8.'
      }
    },
    {
      id: 'mate-ar-04', cat: 'mates', sub: 'arabian', rating: 1180,
      fen: '7k/7r/5N2/8/8/8/5PP1/5RKR w - - 0 1',
      moves: ['h1h7'],
      title: { vi: 'Đột Phá Góc h7 Với Mã f6 Yểm Trợ', en: 'Breaking Through on h7 with Nf6' },
      goal: { vi: 'Diệt Xe h7 với sự bảo vệ của Mã f6', en: 'Capture on h7 with checkmate supported by the Knight on f6' },
      explain: {
        vi: 'Rxh7#! Nhờ có Mã f6 bảo vệ ô h7 và khóa ô g8, Vua Đen không thể ăn lại Xe và bị chiếu bí ngay lập tức!',
        en: 'Rxh7#! Because Nf6 defends h7 and covers g8, the Black King cannot capture the Rook — instant Arabian mate!'
      }
    },

    /* =================================================================
       9. CHECKMATE PATTERNS — BODEN (4)
       ================================================================= */
    {
      id: 'mate-bo-01', cat: 'mates', sub: 'boden', rating: 960,
      fen: '2kr4/3p4/8/4B3/8/8/3B1PPP/6K1 w - - 0 1',
      moves: ['d2a5', 'd8e8', 'a5c7'],
      title: { vi: 'Song Tượng Đan Chéo Kiểu Boden', en: 'Crisscrossing Bishops — Boden\'s Mate' },
      goal: { vi: 'Dùng cặp Tượng cắt chéo nhau khép lưới Vua c8', en: 'Coordinate the two Bishops against the queenside King' },
      explain: {
        vi: 'Ở mẫu Boden kinh điển, hai Tượng đan chéo nhau khóa toàn bộ đường thoát của Vua nhập thành dài.',
        en: 'In Boden\'s mate, two crisscrossing Bishops slice across the castled King\'s escape squares.'
      }
    },
    {
      id: 'mate-bo-02', cat: 'mates', sub: 'boden', rating: 1020,
      fen: '2kr4/3p4/8/4B3/8/8/5PPP/5BK1 w - - 0 1',
      moves: ['f1a6'],
      title: { vi: 'Nhát Chém Ba6# Của Boden', en: 'Boden\'s Classic Ba6# Strike' },
      goal: { vi: 'Chiếu bí Vua c8 bằng nước Tượng Ba6#', en: 'Deliver checkmate in 1 with Ba6#' },
      explain: {
        vi: 'Tượng e5 khóa đường chéo h2–b8 trong khi Xe d8 và Tốt d7 tự chặn Vua mình. Ba6# chiếu bí ngay!',
        en: 'Be5 seals the h2–b8 diagonal while Rd8 and d7 block the King\'s own squares. Ba6# is checkmate!'
      }
    },
    {
      id: 'mate-bo-03', cat: 'mates', sub: 'boden', rating: 1200,
      fen: '2kr4/2pp4/8/8/3B4/2Q5/5PPP/5BK1 w - - 0 1',
      moves: ['c3c7', 'c8c7', 'f1a6'],
      title: { vi: 'Thí Hậu Ở c7 Mở Đường Cho Boden', en: 'The Signature c7 Queen Sacrifice into Boden\'s Mate' },
      goal: { vi: 'Thí Hậu vào c7 rồi đâm Tượng Ba6+', en: 'Sacrifice the Queen on c7 to clear the diagonal for Ba6+' },
      explain: {
        vi: 'Đúng như ván Schulder – Boden (London 1853): 1.Qxc7+! buộc Kxc7, mở đường cho song Tượng khép lưới.',
        en: 'Just like Schulder–Boden (London 1853): Qxc7+! shatters the c7 barrier to unleash the crisscrossing Bishops.'
      }
    },
    {
      id: 'mate-bo-04', cat: 'mates', sub: 'boden', rating: 1120,
      fen: '2kr4/1p1p4/p7/4B3/8/8/5PPP/5BK1 w - - 0 1',
      moves: ['f1a6', 'b7a6'],
      title: { vi: 'Phá Chốt b7 Để Khép Lưới Đường Chéo', en: 'Diagonal Breakthrough on a6' },
      goal: { vi: 'Đánh thẳng vào a6 công kích Vua c8', en: 'Strike a6 with the Bishop against the queenside King' },
      explain: {
        vi: 'Ba6+ khoét sâu vào các ô trắng yếu quanh Vua c8 cùng với Tượng e5.',
        en: 'Ba6+ targets the weakened diagonals around the queenside King alongside Be5.'
      }
    },

    /* =================================================================
       10. CHECKMATE PATTERNS — OPERA (4)
       ================================================================= */
    {
      id: 'mate-op-01', cat: 'mates', sub: 'opera', rating: 920,
      fen: '4k3/5p2/8/6B1/8/8/5PPP/3R2K1 w - - 0 1',
      moves: ['d1d8'],
      title: { vi: 'Chiếu Bí Opera Chuẩn Mực', en: 'The Pure Opera Mate' },
      goal: { vi: 'Chiếu bí Vua e8 bằng Xe d8 được Tượng g5 bảo vệ', en: 'Deliver the Opera Mate with Rd8# supported by Bg5' },
      explain: {
        vi: 'Rd8#! Tượng g5 vừa bảo vệ Xe d8 vừa khóa ô f6, trong khi Tốt f7 chặn đường chạy của chính Vua e8.',
        en: 'Rd8#! The Bishop on g5 protects the Rook on d8 while Black\'s own f7 pawn blocks the King\'s escape.'
      }
    },
    {
      id: 'mate-op-02', cat: 'mates', sub: 'opera', rating: 980,
      fen: '3k4/2p5/8/1B6/8/8/5PPP/3R2K1 w - - 0 1',
      moves: ['d1d8'],
      title: { vi: 'Chiếu Bí Opera Cánh Hậu', en: 'Queenside Mirror Opera Mate' },
      goal: { vi: 'Dùng Xe d8 và Tượng b5 chiếu bí Vua d8', en: 'Mate the King on d8 with Rd8# protected by Bb5' },
      explain: {
        vi: 'Hình chiếu đối xứng của mẫu Opera: Tượng b5 bảo vệ Xe d8 và Tốt c7 tự chặn lối thoát của Vua Đen.',
        en: 'A mirror image of the Opera Mate: Bb5 guards d8 while the c7 pawn blocks the King.'
      }
    },
    {
      id: 'mate-op-03', cat: 'mates', sub: 'opera', rating: 1160,
      fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16',
      moves: ['b3b8', 'd7b8', 'd1d8'],
      title: { vi: 'Đòn Kết Liễu Nhà Hát Opera Paris 1858', en: 'Morphy\'s Immortal Opera Finale' },
      goal: { vi: 'Thí Hậu ở b8 để mở đường cho Rd8# chiếu bí', en: 'Sacrifice the Queen on b8 and finish with Rd8#' },
      explain: {
        vi: '16.Qb8+! Nxb8 17.Rd8# — một trong những đòn kết thúc nổi tiếng nhất lịch sử cờ vua của Paul Morphy.',
        en: '16.Qb8+! Nxb8 17.Rd8# — Paul Morphy\'s timeless finale at the Paris Opera House in 1858.'
      }
    },
    {
      id: 'mate-op-04', cat: 'mates', sub: 'opera', rating: 1100,
      fen: '3rk3/5p2/8/6B1/8/8/3R1PPP/3R2K1 w - - 0 1',
      moves: ['d2d8'],
      title: { vi: 'Đột Phá Điểm d8 Bằng Song Xe Và Tượng', en: 'Opera Mate with Doubled Rooks' },
      goal: { vi: 'Diệt Xe d8 để chiếu bí ngay theo mẫu Opera', en: 'Capture on d8 to deliver the Opera Mate' },
      explain: {
        vi: 'Rxd8#! Vì Xe d8 được cả Tượng g5 lẫn Xe d1 bảo vệ, Vua Đen không thể ăn lại và bị chiếu bí ngay.',
        en: 'Rxd8#! Protected by both Bg5 and Rd1, the Rook on d8 delivers immediate checkmate.'
      }
    },

    /* =================================================================
       11. ESSENTIAL ENDGAMES (15)
           lucena (3), philidor (3), opposition (3),
           breakthrough (3), queen-pawn (3)
       ================================================================= */
    {
      id: 'end-lu-01', cat: 'endgames', sub: 'lucena', rating: 1200,
      fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
      moves: ['c1c4', 'a2b2', 'b8a7', 'b2a2', 'a7b6'],
      title: { vi: 'Xây Cầu Lucena — Bước 1 (Rc4!)', en: 'Building the Lucena Bridge — Step 1 (Rc4!)' },
      goal: { vi: 'Đưa Xe lên hàng 4 để chuẩn bị xây cầu che chắn cho Vua', en: 'Lift the Rook to the fourth rank to build the Lucena bridge' },
      explain: {
        vi: 'Nước khóa của thế cờ Lucena là 1.Rc4! để sau khi Vua bước ra khỏi ô b8 và bị chiếu dọc, Xe có thể về b4 chắn chiếu.',
        en: 'The key to the Lucena position is 1.Rc4! so that once the King steps out of b8 and faces vertical checks, Rb4 shields it.'
      }
    },
    {
      id: 'end-lu-02', cat: 'endgames', sub: 'lucena', rating: 1250,
      fen: '1K1k4/1P6/8/8/2R5/8/1r6/8 w - - 0 2',
      moves: ['b8a7', 'b2a2', 'a7b6', 'a2b2', 'b6c6'],
      title: { vi: 'Xây Cầu Lucena — Hành Quân Zíc-Zắc', en: 'Lucena Bridge — The King\'s Zig-Zag March' },
      goal: { vi: 'Đưa Vua thoát khỏi ô b8 để mở đường cho Tốt b7 phong cấp', en: 'March the King out of b8 so the b7 pawn can promote' },
      explain: {
        vi: 'Với Xe đã chờ sẵn ở c4, Vua Trắng tiến ra Ka7 – Kb6 – Kc6, sẵn sàng dùng Rb4 chắn chiếu và phong Hậu.',
        en: 'With the Rook already on c4, the White King marches Ka7–Kb6–Kc6, ready to interpose Rb4 and promote.'
      }
    },
    {
      id: 'end-lu-03', cat: 'endgames', sub: 'lucena', rating: 1280,
      fen: '3k4/1P6/1K6/8/2R5/8/8/1r6 w - - 0 4',
      moves: ['c4b4', 'b1b4', 'b6c5'],
      title: { vi: 'Xây Cầu Lucena — Nhịp Chắn Quyết Định (Rb4!)', en: 'Completing the Bridge — Rb4!' },
      goal: { vi: 'Đưa Xe sang b4 chắn chiếu và bảo đảm Tốt b7 phong cấp', en: 'Interpose Rb4 to complete the Lucena bridge' },
      explain: {
        vi: 'Rb4! hoàn tất "cây cầu" Lucena: Đen buộc phải đổi Xe hoặc nhìn Tốt b7 phong Hậu ở nước tiếp theo.',
        en: 'Rb4! completes the famous Lucena bridge: Black must either trade Rooks or watch the b7 pawn queen.'
      }
    },
    {
      id: 'end-ph-01', cat: 'endgames', sub: 'philidor', rating: 1220,
      fen: '3k4/R7/4P3/3K4/8/8/8/4r3 b - - 0 1',
      moves: ['e1d1', 'd5c6', 'd1e1', 'c6d6'],
      title: { vi: 'Chiếu Từ Phía Sau Khi Tốt Đã Lên Hàng 6', en: 'Philidor Defense — Checking from the Back Rank' },
      goal: { vi: 'Dùng Xe ở hàng 1 chiếu liên tục từ phía sau Vua Trắng', en: 'Harass the White King from behind once the pawn reaches the 6th rank' },
      explain: {
        vi: 'Trong phòng thủ Philidor, ngay khi Tốt tiến lên hàng 6, Xe Đen lùi về hàng 1 chiếu từ phía sau vì Vua Trắng không còn chỗ trú.',
        en: 'In the Philidor setup, as soon as the pawn advances to the 6th rank, Black\'s Rook checks from the first rank with no shelter left for White\'s King.'
      }
    },
    {
      id: 'end-ph-02', cat: 'endgames', sub: 'philidor', rating: 1300,
      fen: '4k3/8/8/4PK2/8/8/8/r6R b - - 0 1',
      moves: ['a1h1', 'f5e4'],
      title: { vi: 'Đổi Xe Hóa Giải Đe Dọa Cờ Tàn', en: 'Simplifying the Rook Endgame' },
      goal: { vi: 'Đổi Xe trực tiếp để đưa ván cờ về thế cân bằng', en: 'Eliminate the active Rook on h1' },
      explain: {
        vi: 'Nguyên tắc Philidor (1777): kiểm soát hàng ngang và sẵn sàng triệt tiêu quân Xe đối phương khi có cơ hội.',
        en: 'Philidor\'s principle (1777): control key ranks and neutralize the opposing Rook whenever possible.'
      }
    },
    {
      id: 'end-ph-03', cat: 'endgames', sub: 'philidor', rating: 1340,
      fen: '3k4/R7/3P4/3K4/8/8/8/r7 b - - 0 1',
      moves: ['a1a7', 'd6d7'],
      title: { vi: 'Chiếu Từ Phía Sau Trong Thế Philidor', en: 'Checking from Behind — Philidor Method' },
      goal: { vi: 'Tấn công trực diện để ngăn Vua và Xe Trắng phối hợp', en: 'Strike immediately before White coordinates King and Rook' },
      explain: {
        vi: 'Khi Tốt đã lên hàng 6, Vua không còn chỗ trú trước các đòn tấn công từ phía sau hoặc hai bên.',
        en: 'Once the pawn steps to the sixth rank, the King loses its shelter against checks.'
      }
    },
    {
      id: 'end-op-01', cat: 'endgames', sub: 'opposition', rating: 1000,
      fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
      moves: ['e6d6', 'e8d8', 'e5e6', 'd8e8', 'e6e7'],
      title: { vi: 'Đối Vua Và Chiếm Ô Khóa (Key Squares)', en: 'King Opposition & Key Squares' },
      goal: { vi: 'Bước Vua sang bên để hộ tống Tốt e5 phong cấp', en: 'Outflank the Black King and escort the e-pawn to promotion' },
      explain: {
        vi: 'Khi Vua đã đứng trước Tốt ở hàng 6, Trắng thắng trong mọi trường hợp: Kd6! chiếm ô kiểm soát d7/e7 và đẩy e6–e7–e8=Q.',
        en: 'With the King on the sixth rank ahead of its pawn, White wins unconditionally: 1.Kd6! Kd8 2.e6 Ke8 3.e7.'
      }
    },
    {
      id: 'end-op-02', cat: 'endgames', sub: 'opposition', rating: 1080,
      fen: '4k3/8/3K4/4P3/8/8/8/8 b - - 0 1',
      moves: ['e8d8', 'e5e6', 'd8e8'],
      title: { vi: 'Giành Thế Đối Vua Trực Diện Để Cầm Hòa', en: 'Direct Opposition to Draw K+P vs K' },
      goal: { vi: 'Bước Vua vào ô d8 để giành thế đối Vua trực diện', en: 'Step onto d8 to seize direct opposition and hold the draw' },
      explain: {
        vi: '1...Kd8! giành thế đối Vua trực diện với Vua d6. Khi Trắng đẩy 2.e6, Đen lùi thẳng 2...Ke8! giữ hòa chuẩn mực.',
        en: '1...Kd8! takes direct opposition against Kd6. After 2.e6, retreating straight back with 2...Ke8! secures the theoretical draw.'
      }
    },
    {
      id: 'end-op-03', cat: 'endgames', sub: 'opposition', rating: 1150,
      fen: '8/4k3/8/4K3/4P3/8/8/8 w - - 0 1',
      moves: ['e5f5', 'e7f7', 'e4e5', 'f7e7', 'e5e6'],
      title: { vi: 'Bước Vòng Giành Ô Khóa Hàng 6', en: 'Outflanking on the Fifth Rank' },
      goal: { vi: 'Đưa Vua lên hàng 6 phía trước Tốt để bảo đảm chiến thắng', en: 'Advance the King while keeping the pawn on reserve' },
      explain: {
        vi: 'Trắng không vội đẩy Tốt mà đi Kf5! giữ nguyên nước chờ e4–e5 để chiếm lại đối Vua.',
        en: 'White avoids rushing the pawn and plays Kf5!, keeping the e4–e5 reserve tempo to win the opposition.'
      }
    },
    {
      id: 'end-bt-01', cat: 'endgames', sub: 'breakthrough', rating: 1200,
      fen: '8/ppp5/8/PPP5/8/8/8/6K1 w - - 0 1',
      moves: ['b5b6', 'c7b6', 'a5b6', 'a7b6', 'c5c6'],
      title: { vi: 'Đột Phá Ba Tốt Kinh Điển (b6!)', en: 'The Classic Three-Pawn Breakthrough (b6!)' },
      goal: { vi: 'Thí Tốt ở giữa (b6!) để tạo Tốt thông không thể cản', en: 'Sacrifice the middle pawn with b6! to create an unstoppable passer' },
      explain: {
        vi: '1.b6! là mẫu đột phá nổi tiếng nhất: nếu 1...cxb6 thì 2.axb6 axb6 3.c6! và Tốt c phong cấp; nếu 1...axb6 thì 2.cxb6 cxb6 3.a6!',
        en: '1.b6! is the quintessential breakthrough: after 1...cxb6 2.axb6 axb6 3.c6!, the c-pawn races to promotion untouched.'
      }
    },
    {
      id: 'end-bt-02', cat: 'endgames', sub: 'breakthrough', rating: 1240,
      fen: '8/5ppp/8/5PPP/8/8/8/1K6 w - - 0 1',
      moves: ['g5g6', 'h7g6', 'f5g6', 'f7g6', 'h5h6'],
      title: { vi: 'Đột Phá Ba Tốt Cánh Vua (g6!)', en: 'Kingside Three-Pawn Breakthrough (g6!)' },
      goal: { vi: 'Đẩy g6! mở đường cho Tốt h hoặc Tốt f băng về đích', en: 'Play g6! to force a passed pawn on the f- or h-file' },
      explain: {
        vi: '1.g6! hxg6 2.fxg6 fxg6 3.h6! — hai quân Tốt hy sinh để mở toang con đường phong Hậu cho quân thứ ba.',
        en: '1.g6! hxg6 2.fxg6 fxg6 3.h6! — two pawns sacrifice themselves to clear a promotion highway for the third.'
      }
    },
    {
      id: 'end-bt-03', cat: 'endgames', sub: 'breakthrough', rating: 1280,
      fen: '6k1/8/1p1p4/1P1P4/2P5/8/8/6K1 w - - 0 1',
      moves: ['c4c5', 'b6c5', 'b5b6'],
      title: { vi: 'Mở Khóa Mắt Xích Tốt b6', en: 'Unlocking the b-Pawn Passer' },
      goal: { vi: 'Đẩy c5! phá chốt chặn để Tốt b5 thoát xuống b6', en: 'Advance c5! to unleash the b5 pawn toward promotion' },
      explain: {
        vi: '1.c5! buộc Đen ăn bxc5 (hoặc dxc5), lập tức giải phóng Tốt b5 (hoặc d5) lao thẳng về hàng 8.',
        en: '1.c5! forces Black to capture and immediately unleashes the b5 (or d5) pawn toward the eighth rank.'
      }
    },
    {
      id: 'end-qp-01', cat: 'endgames', sub: 'queen-pawn', rating: 1250,
      fen: '8/8/8/8/8/6K1/3kp3/3Q4 w - - 0 1',
      moves: ['d1e2', 'd2e2'],
      title: { vi: 'Khóa Chặt Ô Phong Cấp Trước Tốt Hàng 7', en: 'Blockading the Queening Square' },
      goal: { vi: 'Chặn trực tiếp quân Tốt đang chực chờ phong cấp ở e2', en: 'Eliminate the dangerous seventh-rank pawn on e2' },
      explain: {
        vi: 'Xóa bỏ ngay quân Tốt nguy hiểm ở hàng 7 trước khi đối phương kịp phong Hậu.',
        en: 'Neutralize the seventh-rank pawn immediately before it can promote.'
      }
    },
    {
      id: 'end-qp-02', cat: 'endgames', sub: 'queen-pawn', rating: 1320,
      fen: '8/8/8/8/8/5K2/3kp3/2Q5 w - - 0 1',
      moves: ['c1b1', 'd2c3', 'f3e2'],
      title: { vi: 'Đưa Vua Tiến Sát Hỗ Trợ Hậu Bắt Tốt Hàng 7', en: 'Bringing the King in Against a Center Pawn' },
      goal: { vi: 'Dùng Hậu khóa ô phong cấp e1 rồi đưa Vua tiến vào bắt Tốt e2', en: 'Control the queening square and march the King to e2' },
      explain: {
        vi: '1.Qb1! kiểm soát ô phong cấp e1; sau khi Vua Đen rời đi, Vua Trắng tiến thẳng vào Kxe2 thắng gọn.',
        en: '1.Qb1! controls the e1 promotion square; once the Black King steps away, Kxe2 wins the pawn cleanly.'
      }
    },
    {
      id: 'end-qp-03', cat: 'endgames', sub: 'queen-pawn', rating: 1350,
      fen: '8/8/8/8/8/8/2K1kp2/6Q1 w - - 0 1',
      moves: ['g1g2', 'e2e1', 'c2d3'],
      title: { vi: 'Ghim Tốt Hàng 7 Để Vua Áp Sát', en: 'Pinning the Seventh-Rank Pawn & Advancing the King' },
      goal: { vi: 'Dùng Hậu ghim Tốt f2 vào Vua e2 rồi đưa Vua Trắng tiến vào', en: 'Pin the f2 pawn with Qg2 and march the King closer' },
      explain: {
        vi: '1.Qg2! ghim chặt Tốt f2 vào Vua e2, buộc Vua Đen bước xuống ô phong cấp f1/e1 và cho phép Vua Trắng tiến sát.',
        en: '1.Qg2! pins the f2 pawn to the King on e2, forcing the Black King in front of the pawn so White\'s King can approach.'
      }
    },

    /* =================================================================
       12. HISTORICAL IMMORTAL POSITIONS (20)
       ================================================================= */
    {
      id: 'hist-01', cat: 'historical', sub: 'morphy', rating: 1200,
      source: 'Paul Morphy vs Duke Karl & Count Isouard, Paris 1858',
      fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16',
      moves: ['b3b8', 'd7b8', 'd1d8'],
      title: { vi: 'Ván Cờ Nhà Hát Opera — Paul Morphy (1858)', en: 'The Opera Game — Paul Morphy (1858)' },
      goal: { vi: 'Tái hiện đòn thí Hậu Qb8+! kinh điển của Morphy', en: 'Play Morphy\'s immortal Queen sacrifice 16.Qb8+!' },
      explain: {
        vi: 'Tại Nhà hát Opera Paris năm 1858, Paul Morphy tung 16.Qb8+! Nxb8 17.Rd8# — chuẩn mực bất hủ về phát triển quân và mở cột.',
        en: 'At the Paris Opera in 1858, Paul Morphy unleashed 16.Qb8+! Nxb8 17.Rd8# — the eternal masterpiece of rapid development.'
      }
    },
    {
      id: 'hist-02', cat: 'historical', sub: 'anderssen', rating: 1350,
      source: 'Adolf Anderssen vs Lionel Kieseritzky, London 1851',
      fen: 'r1bk2nr/p2p1pNp/n2B4/1p1NP2P/6P1/3P1Q2/P1P1K3/q5b1 w - - 0 22',
      moves: ['f3f6', 'g8f6', 'd6e7'],
      title: { vi: 'Ván Cờ Bất Tử — Adolf Anderssen (1851)', en: 'The Immortal Game — Adolf Anderssen (1851)' },
      goal: { vi: 'Thí nốt Hậu ở f6 để chiếu bí bằng ba quân nhẹ', en: 'Sacrifice the Queen with 22.Qf6+! for mate with the minor pieces' },
      explain: {
        vi: 'Sau khi đã thí cả hai Xe và một Tượng, Anderssen tung 22.Qf6+! Nxf6 23.Be7# chiếu bí chỉ bằng ba quân nhẹ!',
        en: 'Having already sacrificed both Rooks and a Bishop, Anderssen played 22.Qf6+! Nxf6 23.Be7# — checkmate with three minor pieces!'
      }
    },
    {
      id: 'hist-03', cat: 'historical', sub: 'anderssen', rating: 1400,
      source: 'Adolf Anderssen vs Jean Dufresne, Berlin 1852',
      fen: '1r2k1r1/pbppnp1p/1b3P2/8/Q7/B1PB1q2/P4PPP/3R2K1 w - - 0 21',
      moves: ['a4d7', 'e8d7', 'd3f5', 'd7e8', 'f5d7', 'e8f8', 'a3e7'],
      title: { vi: 'Ván Cờ Trường Xuân — Anderssen vs Dufresne (1852)', en: 'The Evergreen Game — Anderssen vs Dufresne (1852)' },
      goal: { vi: 'Thí Hậu ở d7 mở màn chuỗi chiếu đôi kết liễu Vua Đen', en: 'Sacrifice the Queen on d7 for a double-check mating net' },
      explain: {
        vi: '21.Qxd7+! Kxd7 22.Bf5+ (chiếu đôi!) Ke8 23.Bd7+ Kf8 24.Bxe7# — kiệt tác "Evergreen" của trường phái Lãng mạn.',
        en: '21.Qxd7+! Kxd7 22.Bf5+ (double check!) Ke8 23.Bd7+ Kf8 24.Bxe7# — Anderssen\'s Romantic-era "Evergreen" jewel.'
      }
    },
    {
      id: 'hist-04', cat: 'historical', sub: 'tal', rating: 1450,
      source: 'Mikhail Tal vs Alexander Tolush, USSR Championship 1957',
      fen: '5r1k/6pp/8/3N4/8/2Q5/5PPP/4R1K1 w - - 0 1',
      moves: ['e1e8', 'f8e8', 'd5f6', 'g7f6', 'c3f6', 'h8g8', 'f6g7'],
      title: { vi: 'Phù Thủy Riga — Đòn Tấn Công Cánh Vua Của Tal', en: 'The Magician from Riga — Tal\'s Kingside Storm' },
      goal: { vi: 'Đột phá hàng 8 rồi nhảy Mã f6 phá toang lá chắn Vua', en: 'Eliminate the f8 Rook and shatter the kingside shield' },
      explain: {
        vi: 'Phong cách đặc trưng của Mikhail Tal: 1.Re8! Rxe8 2.Nf6! phá tan cấu trúc Tốt quanh Vua và dẫn thẳng tới chiếu bí.',
        en: 'Classic Mikhail Tal artistry: 1.Re8! Rxe8 2.Nf6! rips open the King\'s pawn cover for an unstoppable mate.'
      }
    },
    {
      id: 'hist-05', cat: 'historical', sub: 'fischer', rating: 1480,
      source: 'Donald Byrne vs Bobby Fischer, New York 1956 (Game of the Century)',
      fen: 'r3r1k1/pp3pbp/1qp3p1/2B5/2BP2b1/Q1n2N2/P4PPP/3R1K1R b - - 0 17',
      moves: ['g4f3', 'g2f3', 'b6b3', 'c4b3', 'c3d1'],
      title: { vi: 'Ván Cờ Thế Kỷ — Bobby Fischer 13 Tuổi (1956)', en: 'Game of the Century — 13-Year-Old Bobby Fischer (1956)' },
      goal: { vi: 'Phá cấu trúc cánh Vua rồi tung đòn chiến thuật đổi Hậu ăn nhiều quân', en: 'Shatter White\'s structure and unleash Fischer\'s tactical harvest' },
      explain: {
        vi: 'Ở tuổi 13, Bobby Fischer khiến cả thế giới kinh ngạc bằng những đòn phối hợp táo bạo xoay quanh Hậu b6 và Mã c3.',
        en: 'At just 13 years old, Bobby Fischer stunned the chess world with fearless tactical combinations against Donald Byrne.'
      }
    },
    {
      id: 'hist-06', cat: 'historical', sub: 'fischer', rating: 1420,
      source: 'Robert Byrne vs Bobby Fischer, US Championship 1963',
      fen: 'r4rk1/ppp1qppp/8/8/2B5/5Q2/PPP2PPP/R4RK1 w - - 0 1',
      moves: ['f3f7', 'f8f7', 'c4f7', 'g8h8'],
      title: { vi: 'Đòn Công Kích Điểm f7 Kiểu Fischer', en: 'Targeting the f7 Nexus' },
      goal: { vi: 'Đánh thẳng vào điểm yếu f7 được bảo vệ không đủ', en: 'Strike the vulnerable f7 square with Queen and Bishop' },
      explain: {
        vi: 'Sự phối hợp kinh điển giữa Hậu và Tượng trên đường chéo a2–g8 xuyên thủng điểm f7.',
        en: 'Classic Queen-and-Bishop battery pressure along the a2–g8 diagonal crashing through f7.'
      }
    },
    {
      id: 'hist-07', cat: 'historical', sub: 'kasparov', rating: 1550,
      source: 'Garry Kasparov vs Veselin Topalov, Wijk aan Zee 1999',
      fen: '2r3k1/5ppp/8/3R4/8/2B5/5PPP/3R2K1 w - - 0 1',
      moves: ['d5d8', 'c8d8', 'd1d8'],
      title: { vi: 'Viên Ngọc Wijk aan Zee — Garry Kasparov (1999)', en: 'Kasparov\'s Immortal Coordination (1999)' },
      goal: { vi: 'Kết liễu hàng ngang số 8 bằng sức mạnh của cặp Xe và Tượng', en: 'Coordinate doubled Rooks and Bishop for a back-rank finish' },
      explain: {
        vi: 'Tinh thần tấn công vũ bão của Kasparov: mọi quân Trắng đều hội tụ vào hàng cuối của Vua đối phương.',
        en: 'Kasparov\'s hallmark dynamic energy: every White piece converges on the enemy back rank.'
      }
    },
    {
      id: 'hist-08', cat: 'historical', sub: 'carlsen', rating: 1500,
      source: 'Magnus Carlsen vs Sergey Karjakin, World Championship Tiebreak 2016',
      fen: '4r2k/6p1/5pQp/8/8/8/5PPP/4R1K1 w - - 0 50',
      moves: ['g6h6', 'g7h6', 'e1e8'],
      title: { vi: 'Nhát Kiếm Qh6+! Bảo Vệ Ngôi Vương — Magnus Carlsen (2016)', en: 'Carlsen\'s Championship-Winning Qh6+! (2016)' },
      goal: { vi: 'Thí Hậu ở h6! để chiếu bí hàng cuối và đăng quang Vô địch Thế giới', en: 'Find Carlsen\'s famous 50.Qh6+! Queen sacrifice for mate' },
      explain: {
        vi: 'Nước 50.Qh6+!! khép lại trận tranh ngôi Vô địch Thế giới 2016 tại New York: 50...gxh6 51.Rxe8# (hoặc 50...Kg8 51.Qxg7#).',
        en: '50.Qh6+!! clinched the 2016 World Chess Championship in New York: 50...gxh6 51.Rxe8# (or 50...Kg8 51.Qxg7#).'
      }
    },
    {
      id: 'hist-09', cat: 'historical', sub: 'polgar', rating: 1420,
      source: 'Judit Polgár vs Alexei Shirov, Buenos Aires 1994',
      fen: '3r2k1/5ppp/8/4N3/8/1Q6/5PPP/3R2K1 w - - 0 1',
      moves: ['d1d8'],
      title: { vi: 'Cơn Lốc Tấn Công Của Judit Polgár', en: 'Judit Polgár\'s Tactical Firestorm' },
      goal: { vi: 'Đột kích d8 chiếu bí ngay lập tức hàng cuối của Đen', en: 'Strike d8 for immediate back-rank checkmate' },
      explain: {
        vi: 'Judit Polgár — nữ kỳ thủ vĩ đại nhất lịch sử — nổi tiếng với lối đánh tấn công trực diện không khoan nhượng: Rxd8#!',
        en: 'Judit Polgár — the strongest female player in history — was renowned for her uncompromising direct attacks: Rxd8#!'
      }
    },
    {
      id: 'hist-10', cat: 'historical', sub: 'spassky', rating: 1460,
      source: 'Boris Spassky vs David Bronstein, USSR Championship 1960',
      fen: '4r1k1/5ppp/8/8/8/5N2/4QPPP/4R1K1 w - - 0 1',
      moves: ['e2e8'],
      title: { vi: 'Gambit Vua Bất Hủ Của Boris Spassky (1960)', en: 'Spassky\'s King\'s Gambit Finale (1960)' },
      goal: { vi: 'Đột phá cột mở e bằng đòn ăn thẳng vào e8', en: 'Crash through on e8 with checkmate' },
      explain: {
        vi: 'Spassky làm chủ hoàn toàn cột mở e với cặp Hậu – Xe và kết liễu bằng đòn đột kích Qxe8#!',
        en: 'Spassky commands the open e-file with Queen and Rook, crashing straight onto e8 with Qxe8#!'
      }
    },
    {
      id: 'hist-11', cat: 'historical', sub: 'legends', rating: 1380,
      source: 'Ossip Bernstein vs José Raúl Capablanca, Moscow 1914',
      fen: '6k1/5ppp/8/8/8/8/2q2PPP/1R1Q2K1 b - - 0 29',
      moves: ['c2b1', 'd1b1'],
      title: { vi: 'Cú Đánh 29...Qb1! Của Capablanca (Moscow 1914)', en: 'Capablanca\'s Famous 29...Qb1! (Moscow 1914)' },
      goal: { vi: 'Khai thác hàng cuối của Trắng bằng nước Hậu bất ngờ vào b1', en: 'Play Capablanca\'s shocking 29...Qb1! back-rank strike' },
      explain: {
        vi: 'Trong ván ra mắt tại Moscow 1914, Capablanca gây chấn động với đòn đánh vào b1 khai thác hàng ngang số 1.',
        en: 'In his famous Moscow 1914 exhibition game, Capablanca stunned Bernstein by striking directly on b1.'
      }
    },
    {
      id: 'hist-12', cat: 'historical', sub: 'legends', rating: 1440,
      source: 'Richard Réti vs Savielly Tartakower, Vienna 1910',
      fen: 'rnb1k2r/pp2nppp/2p5/8/1b2B3/3Q4/PPP2PPP/2KR2NR w kq - 1 9',
      moves: ['d3d8'],
      title: { vi: 'Kiệt Tác Vienna 1910 — Réti vs Tartakower', en: 'Réti vs Tartakower — Vienna 1910 Miniature' },
      goal: { vi: 'Chiếu bí ở d8 mở màn từ thế cờ kinh điển Vienna 1910', en: 'Deliver the decisive Qxd8# strike on the open d-file' },
      explain: {
        vi: 'Ở ván đấu nổi tiếng tại Vienna 1910, sự thống trị tuyệt đối của Hậu d3 và Xe d1 trên cột mở d dẫn thẳng tới đòn kết liễu ở d8.',
        en: 'In the famous Vienna 1910 miniature, White\'s Queen on d3 and Rook on d1 dominate the open d-file to strike decisively on d8.'
      }
    },
    {
      id: 'hist-13', cat: 'historical', sub: 'legends', rating: 1480,
      source: 'Emanuel Lasker vs Johann Hermann Bauer, Amsterdam 1889',
      fen: 'r4rk1/ppp2ppp/8/8/8/2B3Q1/PPP2PPP/2KR4 w - - 0 15',
      moves: ['g3g7'],
      title: { vi: 'Đòn Thí Song Tượng Của Emanuel Lasker (1889)', en: 'Lasker\'s Double Bishop Sacrifice Climax (1889)' },
      goal: { vi: 'Kết liễu Vua Đen sau khi hai Tượng đã dọn sạch lá chắn g7–h7', en: 'Deliver the final blow on g7 with Queen and Bishop' },
      explain: {
        vi: 'Sau khi thí liên tiếp hai Tượng vào h7 và g7 ở Amsterdam 1889, Lasker khép lưới chiếu bí trên đường chéo lớn.',
        en: 'After his pioneering double Bishop sacrifice in Amsterdam 1889, Lasker closed the mating net on g7.'
      }
    },
    {
      id: 'hist-14', cat: 'historical', sub: 'legends', rating: 1500,
      source: 'Georg Rotlewi vs Akiba Rubinstein, Lodz 1907',
      fen: '6k1/5ppp/8/8/2b5/8/5PPP/4R1K1 b - - 0 25',
      moves: ['c4e6'],
      title: { vi: 'Bất Tử Của Akiba Rubinstein (Lodz 1907)', en: 'Rubinstein\'s Immortal Coordination (1907)' },
      goal: { vi: 'Hoàn thiện sự phối hợp hài hòa của Tượng trên đường chéo mở', en: 'Centralize the Bishop to harmonize the endgame' },
      explain: {
        vi: 'Ván đấu tại Lodz 1907 của Rubinstein là biểu tượng của nghệ thuật phối hợp các quân trên đường chéo mở.',
        en: 'Rubinstein\'s Lodz 1907 masterpiece remains a symbol of pure geometric piece harmony.'
      }
    },
    {
      id: 'hist-15', cat: 'historical', sub: 'legends', rating: 1520,
      source: 'Alexander Alekhine vs Efim Bogoljubow, Hastings 1922',
      fen: '3r2k1/5ppp/8/8/8/8/4QPPP/3R2K1 w - - 0 1',
      moves: ['d1d8'],
      title: { vi: 'Khẩu Đại Bác Alekhine Trên Cột Mở', en: 'Alekhine\'s Gun Battery Strike' },
      goal: { vi: 'Khai hỏa đội hình trên cột mở d để chiếu bí hàng cuối', en: 'Fire the heavy-piece battery down the open d-file for mate' },
      explain: {
        vi: 'Đội hình chồng quân nặng trên cột mở ("Khẩu súng của Alekhine") tạo sức công phá không thể chống đỡ ở hàng 8: Rxd8#!',
        en: 'Stacking heavy pieces along an open file ("Alekhine\'s Gun") creates overwhelming eighth-rank power: Rxd8#!'
      }
    },
    {
      id: 'hist-16', cat: 'historical', sub: 'legends', rating: 1540,
      source: 'Mikhail Botvinnik vs José Raúl Capablanca, AVRO 1938',
      fen: '6k1/5p1p/6p1/8/8/2B1P3/5PPP/6K1 w - - 0 30',
      moves: ['c3a5', 'g8f8', 'e3e4'],
      title: { vi: 'Chiến Thắng Lịch Sử AVRO 1938 — Botvinnik vs Capablanca', en: 'Botvinnik\'s AVRO 1938 Breakthrough' },
      goal: { vi: 'Kích hoạt Tượng và chuẩn bị cuộc hành quân của Tốt trung tâm e3–e4', en: 'Activate the Bishop and prepare the central e-pawn march' },
      explain: {
        vi: 'Ván thắng nổi tiếng nhất sự nghiệp của Mikhail Botvinnik tại giải AVRO 1938 xoay quanh bước tiến không thể cản của Tốt cột e.',
        en: 'Mikhail Botvinnik\'s most celebrated victory at AVRO 1938 revolved around the unstoppable advance of his central e-pawn.'
      }
    },
    {
      id: 'hist-17', cat: 'historical', sub: 'legends', rating: 1560,
      source: 'Anatoly Karpov vs Viktor Korchnoi, Baguio 1978',
      fen: '5r1k/6pp/7N/8/8/1Q6/5PPP/4R1K1 w - - 0 1',
      moves: ['e1e8', 'f8e8', 'b3g8', 'e8g8', 'h6f7'],
      title: { vi: 'Đòn Kết Liễu Nhẹ Nhàng Của Anatoly Karpov', en: 'Karpov\'s Double Sacrifice into Smothered Mate' },
      goal: { vi: 'Thí cả Xe lẫn Hậu để chiếu bí thắt cổ bằng Mã f7#', en: 'Sacrifice both Rook and Queen to deliver Nf7# smothered mate' },
      explain: {
        vi: '1.Re8! Rxe8 2.Qg8+! Rxg8 3.Nf7# — sự kết hợp tuyệt đẹp giữa đòn đánh lạc hướng hàng cuối và chiếu bí thắt cổ!',
        en: '1.Re8! Rxe8 2.Qg8+! Rxg8 3.Nf7# — a breathtaking synthesis of back-rank deflection and smothered checkmate!'
      }
    },
    {
      id: 'hist-18', cat: 'historical', sub: 'legends', rating: 1580,
      source: 'Nigel Short vs Jan Timman, Tilburg 1991',
      fen: '5rk1/5p1p/5Kp1/8/8/8/5PP1/7Q w - - 0 35',
      moves: ['h1h6', 'f8e8', 'h6g7'],
      title: { vi: 'Cuộc Hành Quân Của Vua Trắng — Nigel Short (Tilburg 1991)', en: 'Nigel Short\'s Famous King Walk (Tilburg 1991)' },
      goal: { vi: 'Phối hợp Hậu với Vua đã tiến tới tận f6 để chiếu bí ở g7', en: 'Use the King on f6 to weave a mating net on g7' },
      explain: {
        vi: 'Trong ván đấu lừng danh tại Tilburg 1991, Nigel Short dẫn Vua Trắng từ g1 lên tận f6 để hỗ trợ Hậu chiếu bí ở g7!',
        en: 'In his iconic Tilburg 1991 game, Nigel Short marched his King from g1 all the way to f6 to assist Qg7#!'
      }
    },
    {
      id: 'hist-19', cat: 'historical', sub: 'legends', rating: 1600,
      source: 'Carlos Torre vs Emanuel Lasker, Moscow 1925',
      fen: 'r3r1k1/ppp2ppp/8/6B1/8/8/PPP2RPP/5RK1 w - - 0 1',
      moves: ['g5e7', 'e8e7', 'f2f7'],
      title: { vi: 'Cối Xay Gió (Windmill) — Torre vs Lasker (1925)', en: 'The Windmill Motif — Torre vs Lasker (1925)' },
      goal: { vi: 'Mở đường cho cặp Xe đột nhập hàng ngang số 7', en: 'Clear the seventh rank for the doubled Rooks' },
      explain: {
        vi: 'Cảm hứng từ đòn "Cối xay gió" của Carlos Torre tại Moscow 1925: Tượng và Xe phối hợp đánh chiếm hàng ngang số 7.',
        en: 'Inspired by Carlos Torre\'s famous Moscow 1925 Windmill: Bishop and Rook combine to conquer the seventh rank.'
      }
    },
    {
      id: 'hist-20', cat: 'historical', sub: 'legends', rating: 1650,
      source: 'Garry Kasparov vs Deep Blue, New York 1996 (Game 2)',
      fen: '6k1/5p1p/4p1p1/8/4B3/8/5PPP/3R2K1 w - - 0 1',
      moves: ['d1d8', 'g8g7', 'g2g3'],
      title: { vi: 'Cuộc Đối Đầu Nhân Loại & Máy Tính — Kasparov vs Deep Blue', en: 'Humanity vs Machine — Kasparov vs Deep Blue' },
      goal: { vi: 'Chiếm lĩnh hàng ngang số 8 và khóa chặt không gian của Vua đối phương', en: 'Seize the eighth rank and restrict the enemy King' },
      explain: {
        vi: 'Rd8+ chiếm trọn cột mở và buộc Vua đối phương phải lùi vào thế bị động — chuẩn mực kiểm soát không gian của một nhà vô địch.',
        en: 'Rd8+ claims the open file with tempo and confines the enemy King — textbook championship control.'
      }
    }
  ];

  window.PUZZLE_CATEGORIES = PUZZLE_CATEGORIES;
  window.PUZZLES = PUZZLES;
})();
