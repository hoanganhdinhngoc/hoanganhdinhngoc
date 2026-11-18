/* =====================================================================
   Chess System — i18n.js
   Global: I18N — bilingual (vi default / en) standard chess localization
   ===================================================================== */
(function () {
  'use strict';

  const CLASS_SYMBOL = {
    brilliant: '!!', best: '★', great: '!', book: 'BOOK', good: 'GOOD',
    inaccuracy: '?!', mistake: '?', blunder: '??'
  };

  const vi = {
    /* ---------- Main Menu & UI ---------- */
    'ui.title': 'NieR Chess',
    'ui.subtitle': 'CỜ VUA TIÊU CHUẨN & PHÂN TÍCH CHIẾN THUẬT',
    'menu.play': 'CHƠI NGAY',
    'menu.playBot': 'Chơi với Máy (Bot)',
    'menu.playPvp': '2 Người Chơi (Cùng máy)',
    'menu.playPuzzles': 'Cờ Thế & Câu Đố (100)',
    'menu.load': 'TẢI VÁN CỜ / LƯU TRỮ',
    'menu.settings': 'CÀI ĐẶT',
    'menu.profile': 'HỒ SƠ NGƯỜI CHƠI',
    'drawer.toMain': 'Về Menu Chính',
    'drawer.load': 'Tải / Lưu Trữ Ván Cờ',
    'drawer.profile': 'Hồ Sơ Người Chơi',
    'drawer.settings': 'Cài Đặt',
    'pause.title': 'Pause',
    'pause.hold': 'Hold 3s to resume',
    'pause.click': 'Click to resume',
    'ui.confirm': 'XÁC NHẬN',

    'ui.newOperation': 'THIẾT LẬP VÁN ĐẤU',
    'ui.gameMode': 'Chế độ chơi',
    'ui.selectOpponent': 'Chọn cấp độ máy',
    'ui.yourColor': 'Quân của bạn',
    'ui.white': 'TRẮNG', 'ui.black': 'ĐEN', 'ui.random': 'NGẪU NHIÊN',
    'ui.timeControl': 'Thời gian suy nghĩ',
    'ui.opponentUnit': 'ĐỐI THỦ',
    'ui.liveEval': 'PHÂN TÍCH',
    'ui.coachHud': 'PHÂN TÍCH NƯỚC ĐI',
    'ui.evaluation': 'Đánh giá',
    'ui.movesReview': 'BIÊN BẢN VÁN CỜ',
    'ui.puzzleLib': 'CHỌN CỜ THẾ / CÂU ĐỐ',
    'ui.archive': 'VÁN CỜ ĐÃ LƯU & TẢI FILE',
    'ui.promotion': 'PHONG CẤP TỐT',
    'ui.you': 'Bạn', 'ui.bot': 'Máy',
    'ui.whiteSide': 'Trắng', 'ui.blackSide': 'Đen',
    'ui.depth': 'Độ sâu {d}',

    'mode.bot': 'CHƠI VỚI MÁY', 'mode.pvp': '2 NGƯỜI CHƠI', 'mode.puzzle': 'CỜ THẾ', 'mode.review': 'PHÂN TÍCH VÁN ĐẤU',
    'tab.coach': 'PHÂN TÍCH', 'tab.moves': 'BIÊN BẢN', 'tab.puzzles': 'CỜ THẾ', 'tab.archive': 'LƯU TRỮ',

    /* ---------- Buttons ---------- */
    'btn.menu': 'MENU CHÍNH',
    'btn.profile': 'HỒ SƠ', 'btn.settings': 'CÀI ĐẶT',
    'btn.start': 'BẮT ĐẦU VÁN CỜ', 'btn.new': 'VÁN MỚI', 'btn.flip': 'XOAY BÀN',
    'btn.takeback': 'ĐI LẠI', 'btn.resign': 'ĐẦU HÀNG',
    'btn.showOptimal': 'XEM NƯỚC TỐI ƯU', 'btn.hideOptimal': 'ẨN NƯỚC TỐI ƯU',
    'btn.coachTakeback': 'ĐI LẠI NƯỚC NÀY',
    'btn.back': '< LÙI', 'btn.next': 'TIẾN >',
    'btn.nextCritical': '>> NƯỚC QUAN TRỌNG TIẾP THEO',
    'btn.analyze': 'PHÂN TÍCH TOÀN BỘ VÁN', 'btn.save': 'LƯU TRÌNH DUYỆT', 'btn.export': 'TẢI FILE .JSON', 'btn.import': 'TẢI LÊN FILE .JSON',
    'btn.hint': 'GỢI Ý', 'btn.retry': 'THỬ LẠI', 'btn.canonical': 'XEM ĐÁP ÁN CHUẨN',
    'btn.canonicalNext': 'NƯỚC TIẾP THEO >', 'btn.nextPuzzle': 'BÀI TIẾP >',
    'btn.selectPuzzle': 'ĐỔI CÂU ĐỐ',
    'btn.close': 'ĐÓNG', 'btn.confirm': 'XÁC NHẬN', 'btn.cancel': 'HỦY',
    'btn.review': 'PHÂN TÍCH VÁN ĐẤU', 'btn.load': 'MỞ PHÂN TÍCH', 'btn.delete': 'XÓA',
    'btn.favorite': '☆ ĐÁNH DẤU', 'btn.unfavorite': '★ BỎ ĐÁNH DẤU',

    'tc.none': 'Không giới hạn thời gian',

    /* ---------- Settings / Profile ---------- */
    'settings.title': 'CÀI ĐẶT',
    'settings.language': 'Ngôn ngữ / Language',
    'settings.audio': 'Âm thanh tương tác',
    'settings.audioOn': 'Bật âm thanh quân cờ & giao diện',
    'settings.bgm': 'Nhạc nền',
    'settings.bgmOn': 'Bật nhạc nền khi chơi',
    'settings.gameplay': 'Tùy chọn bàn cờ',
    'settings.showLegal': 'Hiển thị nước đi hợp lệ',
    'settings.showCoords': 'Hiển thị tọa độ bàn cờ (a–h, 1–8)',
    'settings.autoFlip': 'Tự động xoay bàn cờ mỗi lượt (chế độ 2 người)',
    'settings.cloudEval': 'Sử dụng cơ sở dữ liệu Lichess Cloud khi trực tuyến',
    'settings.engine': 'Công cụ: {engine} · Thiết bị: {device} · Luồng: {threads} · Độ sâu: {depth}',
    'settings.mobile': 'Di động', 'settings.desktop': 'Máy tính',

    'profile.title': 'THÔNG TIN NGƯỜI CHƠI',
    'profile.intro': 'Thiết lập tên và hệ số Elo của người chơi. Thông tin này được lưu trên trình duyệt và ghi vào biên bản PGN / JSON.',
    'profile.p1': 'NGƯỜI CHƠI 1', 'profile.p2': 'NGƯỜI CHƠI 2 (CHẾ ĐỘ 2 NGƯỜI)',
    'profile.name': 'Tên hiển thị', 'profile.elo': 'Hệ số Elo',
    'profile.saved': 'Đã lưu thông tin người chơi.',

    /* ---------- Status ---------- */
    'status.idle': 'Chọn chế độ chơi từ menu để bắt đầu.',
    'status.yourTurn': 'Lượt của bạn ({color}).',
    'status.turnOf': 'Lượt của {name} ({color}).',
    'status.botThinking': '{name} đang suy nghĩ...',
    'status.check': 'Chiếu tướng!',
    'status.checkmate': 'Chiếu bí! {winner} giành chiến thắng.',
    'status.draw': 'Hòa cờ ({reason}).',
    'status.timeout': 'Hết giờ! {winner} giành chiến thắng.',
    'status.resigned': '{loser} đầu hàng. {winner} giành chiến thắng.',
    'status.reviewing': 'Phân tích ván đấu — Nước {ply}/{total}.',
    'status.puzzle': 'Cờ thế: {title} — {color} đi tiên.',
    'status.analyzing': 'Đang phân tích toàn bộ ván đấu...',
    'status.engineLoading': 'Đang khởi tạo công cụ phân tích...',
    'status.engineReady': 'Công cụ sẵn sàng ({engine}).',
    'draw.stalemate': 'Hết nước đi hợp lệ (Stalemate)',
    'draw.repetition': 'Lặp lại thế cờ 3 lần',
    'draw.insufficient': 'Không đủ lực lượng chiếu bí',
    'draw.fifty': 'Luật 50 nước không ăn quân hoặc đi tốt',
    'draw.generic': 'Thỏa thuận hòa',

    'go.win': 'CHIẾN THẮNG', 'go.lose': 'THẤT BẠI', 'go.draw': 'HÒA CỜ', 'go.over': 'KẾT THÚC VÁN ĐẤU',
    'go.text': '{result} ({score}). Bạn có thể mở Phân tích ván đấu để xem lại độ chính xác và các nước đi quan trọng.',

    /* ---------- Classification (Chess.com standard) ---------- */
    'cls.brilliant': 'Thiên tài',
    'cls.best': 'Tốt nhất',
    'cls.great': 'Tuyệt vời',
    'cls.book': 'Sách giáo khoa',
    'cls.good': 'Nước đi tốt',
    'cls.inaccuracy': 'Không chính xác',
    'cls.mistake': 'Sai lầm',
    'cls.blunder': 'Nước đi ngớ ngẩn',

    /* ---------- Coach / Analysis (Standard Algebraic Notation) ---------- */
    'coach.idle': 'Thực hiện một nước đi để xem đánh giá và gợi ý nước đi tối ưu.',
    'coach.off': 'Tính năng phân tích đang tắt. Bấm nút [PHÂN TÍCH] phía trên để bật đánh giá nước đi và gợi ý.',
    'coach.thinking': 'Đang phân tích nước {move}...',
    'coach.ready': 'Đến lượt {color} đi.',
    'coach.optimalIs': 'Nước tối ưu: {move}',
    'coach.optimalShown': 'Mũi tên xanh trên bàn cờ biểu thị nước đi tối ưu {move}.',
    'coach.botMove': '{name} vừa đi {move}.',
    'coach.evalNow': 'Đánh giá hiện tại: {eval}.',
    'coach.moveFmt': '{san}',
    'coach.moveFmtCastleK': 'O-O',
    'coach.moveFmtCastleQ': 'O-O-O',
    'coach.drop': 'mất {drop} điểm đánh giá',
    'coach.gain': 'giữ đánh giá ở mức {eval}',
    'coach.join': ' và ',
    'coach.reasonDrop': '{reason} ({drop}).',
    'coach.reasonEnd': '{reason}.',

    'r.brilliant': 'Nước thí {piece} xuất sắc và hoàn toàn chính xác về mặt tính toán.',
    'r.great': 'Nước đi quan trọng duy nhất giữ vững ưu thế trong hình cờ phức tạp.',
    'r.best': 'Đây là nước đi mạnh nhất theo tính toán của máy.',
    'r.bestAlt': 'Nước đi rất chuẩn xác, có giá trị tương đương với phương án mạnh nhất của máy ({best}).',
    'r.book': 'Nước đi chuẩn lý thuyết khai cuộc.',
    'r.good': 'Nước đi hợp lý, duy trì thế trận ổn định.',
    'r.hangs': 'Nước đi này để hở {piece} ở {square}, cho phép đối phương chơi {reply}',
    'r.movedIntoAttack': 'Nước đi này đưa {piece} vào ô {square} đang bị đối phương kiểm soát ({reply})',
    'r.allowsMate': 'Nước đi này cho phép đối phương chiếu bí cưỡng bức sau {n} nước (bắt đầu bằng {reply})',
    'r.missedMate': 'Bỏ lỡ chuỗi chiếu bí cưỡng bức trong {n} nước',
    'r.missedCapture': 'Bỏ lỡ cơ hội ăn {piece} ở ô {square}',
    'r.tacticalLoss': 'Cho phép đối phương khai thác bằng chuỗi {pv}, dẫn đến mất {piece}',
    'r.allowsFork': 'Cho phép đối phương đi {reply} tạo đòn tấn công đôi vào {targets}',
    'r.allowsCheck': 'Để lộ sơ hở cho đối phương chiếu bằng {reply} và giành quyền chủ động',
    'r.allowsThreat': 'Cho phép đối phương chơi {reply} uy hiếp trực tiếp {piece} ở {square}',
    'r.counterplay': 'Nhường nhịp cho đối phương phản công bằng {pv}',
    'r.center': 'Nước đi này làm suy giảm quyền kiểm soát trung tâm',
    'r.kingSafety': 'Nước đi này làm yếu cấu trúc tốt bảo vệ Vua',
    'r.passive': 'Nước đi hơi thụ động, nhường quyền chủ động cho đối phương',
    'r.lostAdvantage': 'Nước đi này đánh rơi một phần lợi thế đang có',
    'r.generic': 'Nước đi này chưa phải phương án mạnh nhất ở hình cờ hiện tại',

    'p.mate': 'Dẫn tới chiếu bí cưỡng bức sau {n} nước.',
    'p.promote': 'Phong cấp tốt để tạo ưu thế lực lượng quyết định.',
    'p.fork': 'Tạo đòn tấn công đôi uy hiếp {targets} cùng lúc.',
    'p.capture': 'Ăn {piece} ở {square}, thu về lợi thế lực lượng.',
    'p.trade': 'Trao đổi {piece} ở {square} hợp lý để củng cố thế trận.',
    'p.evade': 'Đưa {piece} khỏi vị trí bị đe dọa về ô {square} an toàn.',
    'p.defend': 'Bảo vệ kịp thời {piece} đang bị uy hiếp ở {square}.',
    'p.check': 'Chiếu Vua bằng {piece}, giành nhịp chủ động ép đối phương chống đỡ.',
    'p.threat': 'Đưa {piece} lên {square} trực tiếp uy hiếp {target} ở {tsq}.',
    'p.castle': 'Nhập thành đưa Vua vào an toàn và kích hoạt Xe tham chiến.',
    'p.pawnPush': 'Đẩy tốt tiến sâu xuống {square} để mở rộng không gian và gây sức ép.',
    'p.openFile': 'Chiếm lĩnh tuyến trọng yếu bằng {piece} tại {square}.',
    'p.center': 'Đưa {piece} lên {square} kiểm soát khu vực trung tâm.',
    'p.develop': 'Phát triển {piece} lên {square} thông thoáng để kết nối lực lượng.',
    'p.kingActive': 'Tích cực hóa Vua lên {square} để hỗ trợ thế trận cờ tàn.',
    'p.positional': 'Cải thiện vị trí {piece} tại {square} và duy trì thế trận chặt chẽ.',
    'p.altNote': 'Phương án tương đương với {best}: {purpose}',
    'p.pvPlan': 'Kế hoạch tiếp theo: {pv}.',

    'b.mate': 'Nước tốt nhất là {move}, dẫn tới chiếu bí sau {n} nước.',
    'b.fork': 'Nước tốt nhất là {move}, tạo đòn tấn công đôi vào {targets}.',
    'b.capture': 'Nước tốt nhất là {move}, ăn {piece} và giành lợi thế.',
    'b.promote': 'Nước tốt nhất là {move}, phong cấp tốt.',
    'b.check': 'Nước tốt nhất là {move}, chiếu Vua và giành quyền chủ động.',
    'b.evade': 'Nước tốt nhất là {move}, đưa {piece} về ô {square} an toàn.',
    'b.threat': 'Nước tốt nhất là {move}, đưa {piece} lên uy hiếp {target} ở {tsq}.',
    'b.tacticPv': 'Nước tốt nhất là {move}, mở ra chuỗi phối hợp {pv} giành lợi thế.',
    'b.positionalSq': 'Nước tốt nhất là {move}, điều {piece} tới {square} để kiểm soát thế trận (tiếp theo: {pv}).',
    'b.castle': 'Nước tốt nhất là {move}, đưa Vua vào vị trí an toàn và kích hoạt Xe.',
    'b.center': 'Nước tốt nhất là {move}, kiểm soát các ô trung tâm trọng yếu.',
    'b.develop': 'Nước tốt nhất là {move}, phát triển quân tích cực.',
    'b.defend': 'Nước tốt nhất là {move}, bảo vệ {piece} ở ô {square}.',
    'b.generic': 'Nước tốt nhất là {move} để cải thiện vị trí quân và tạo sức ép.',
    'b.whyBetter': '{move} giữ đánh giá ở mức {eval} thay vì {played}.',

    /* ---------- Review ---------- */
    'review.accuracy': 'ĐỘ CHÍNH XÁC',
    'review.analyzing': 'Đang phân tích {i}/{n}...',
    'review.done': 'Phân tích hoàn tất. Bấm [>> NƯỚC QUAN TRỌNG TIẾP THEO] để xem ngay các bước ngoặt của ván đấu.',
    'review.noCritical': 'Không còn nước đi quan trọng nào phía sau.',
    'review.start': 'Thế cờ ban đầu.',
    'review.playedArrow': 'Mũi tên cam: nước đã đi. Mũi tên xanh: nước tối ưu.',
    'review.playedArrowRed': 'Mũi tên đỏ: nước đã đi. Mũi tên xanh: nước tối ưu.',
    'review.needGame': 'Chưa có nước đi nào để phân tích.',
    'review.moveHeader': 'Nước {no}{dots} {san}',

    /* ---------- Puzzles ---------- */
    'puzzle.all': 'Tất cả chủ đề (100)',
    'puzzle.progress': 'Đã giải: {s}/{n}',
    'puzzle.toMove': '{color} đi',
    'puzzle.correct': 'Chính xác! Hãy tiếp tục...',
    'puzzle.wrong': '{move} chưa phải là lời giải đúng. Hãy thử lại!',
    'puzzle.solved': 'Hoàn thành! Bạn đã giải đúng thế cờ này.',
    'puzzle.hint': 'Gợi ý: Hãy chú ý quân {piece} ở ô {square}.',
    'puzzle.canonicalStep': 'Bước {i}/{n}: {move}',
    'puzzle.canonicalDone': 'Đã hiển thị toàn bộ lời giải chuẩn.',
    'puzzle.select': 'Chọn một thế cờ để bắt đầu giải.',
    'puzzle.rating': 'Elo {r}',
    'puzzle.source': 'Ván đấu: {s}',

    /* ---------- Archive / alerts ---------- */
    'archive.empty': 'Chưa có ván cờ nào được lưu trong trình duyệt.',
    'archive.saved': 'Đã lưu ván cờ vào bộ nhớ trình duyệt.',
    'archive.deleted': 'Đã xóa ván cờ.',
    'archive.imported': 'Đã tải file ván cờ thành công.',
    'archive.importFail': 'File không hợp lệ hoặc bị lỗi định dạng.',
    'archive.exported': 'Đã tải xuống file {file}.',
    'archive.vs': '{w} ({we}) vs {b} ({be})',
    'archive.moves': '{n} bán nước (ply)',
    'alert.confirmResign': 'Bạn có chắc chắn muốn đầu hàng ván này?',
    'alert.confirmNew': 'Bắt đầu ván mới sẽ kết thúc ván hiện tại. Tiếp tục?',
    'alert.noMoves': 'Chưa có nước đi nào.',
    'alert.engineFail': 'Không tải được Stockfish Worker, đang dùng bộ tính toán dự phòng.',
    'alert.takebackNA': 'Không thể đi lại ở thời điểm này.',
    'alert.pausedNA': 'Không khả dụng khi đang tạm dừng (Pause).',
    'alert.illegal': 'Nước đi không hợp lệ.',

    /* ---------- Pieces ---------- */
    'piece.p': 'Tốt', 'piece.n': 'Mã', 'piece.b': 'Tượng', 'piece.r': 'Xe', 'piece.q': 'Hậu', 'piece.k': 'Vua',
    'piece.pl.p': 'Tốt', 'piece.pl.n': 'Mã', 'piece.pl.b': 'Tượng', 'piece.pl.r': 'Xe', 'piece.pl.q': 'Hậu', 'piece.pl.k': 'Vua'
  };

  const en = {
    'ui.title': 'NieR Chess',
    'ui.subtitle': 'STANDARD CHESS & TACTICAL ANALYSIS',
    'menu.play': 'PLAY',
    'menu.playBot': 'Play vs. Computer (Bot)',
    'menu.playPvp': 'Player vs. Player (Pass & Play)',
    'menu.playPuzzles': 'Puzzles & Tactics (100)',
    'menu.load': 'LOAD / SAVED GAMES',
    'menu.settings': 'SETTINGS',
    'menu.profile': 'PLAYER PROFILE',
    'drawer.toMain': 'To Main Menu',
    'drawer.load': 'Load / Saved Games',
    'drawer.profile': 'Profile',
    'drawer.settings': 'Settings',
    'pause.title': 'Pause',
    'pause.hold': 'Hold 3s to resume',
    'pause.click': 'Click to resume',
    'ui.confirm': 'CONFIRM',

    'ui.newOperation': 'GAME SETUP',
    'ui.gameMode': 'Game Mode',
    'ui.selectOpponent': 'Choose Computer Opponent',
    'ui.yourColor': 'Play As',
    'ui.white': 'WHITE', 'ui.black': 'BLACK', 'ui.random': 'RANDOM',
    'ui.timeControl': 'Time Control',
    'ui.opponentUnit': 'OPPONENT',
    'ui.liveEval': 'ANALYSIS',
    'ui.coachHud': 'MOVE ANALYSIS',
    'ui.evaluation': 'Evaluation',
    'ui.movesReview': 'MOVE LIST',
    'ui.puzzleLib': 'SELECT PUZZLE',
    'ui.archive': 'SAVED GAMES & LOAD FILE',
    'ui.promotion': 'PAWN PROMOTION',
    'ui.you': 'You', 'ui.bot': 'Bot',
    'ui.whiteSide': 'White', 'ui.blackSide': 'Black',
    'ui.depth': 'Depth {d}',

    'mode.bot': 'PLAY VS BOT', 'mode.pvp': '2 PLAYERS', 'mode.puzzle': 'PUZZLES', 'mode.review': 'GAME REVIEW',
    'tab.coach': 'ANALYSIS', 'tab.moves': 'MOVES', 'tab.puzzles': 'PUZZLES', 'tab.archive': 'SAVED',

    'btn.menu': 'MAIN MENU',
    'btn.profile': 'PROFILE', 'btn.settings': 'SETTINGS',
    'btn.start': 'START GAME', 'btn.new': 'NEW GAME', 'btn.flip': 'FLIP BOARD',
    'btn.takeback': 'TAKEBACK', 'btn.resign': 'RESIGN',
    'btn.showOptimal': 'SHOW BEST MOVE', 'btn.hideOptimal': 'HIDE BEST MOVE',
    'btn.coachTakeback': 'RETRY MOVE',
    'btn.back': '< PREV', 'btn.next': 'NEXT >',
    'btn.nextCritical': '>> NEXT KEY MOVE',
    'btn.analyze': 'GAME REVIEW', 'btn.save': 'SAVE GAME', 'btn.export': 'EXPORT .JSON', 'btn.import': 'UPLOAD .JSON',
    'btn.hint': 'HINT', 'btn.retry': 'RETRY', 'btn.canonical': 'SHOW SOLUTION',
    'btn.canonicalNext': 'NEXT MOVE >', 'btn.nextPuzzle': 'NEXT PUZZLE >',
    'btn.selectPuzzle': 'CHOOSE PUZZLE',
    'btn.close': 'CLOSE', 'btn.confirm': 'CONFIRM', 'btn.cancel': 'CANCEL',
    'btn.review': 'GAME REVIEW', 'btn.load': 'OPEN REVIEW', 'btn.delete': 'DELETE',
    'btn.favorite': '☆ FAVORITE', 'btn.unfavorite': '★ UNFAVORITE',

    'tc.none': 'Unlimited Time',

    'settings.title': 'SETTINGS',
    'settings.language': 'Language / Ngôn ngữ',
    'settings.audio': 'Sound Effects',
    'settings.audioOn': 'Enable board & UI sounds',
    'settings.bgm': 'Background Music',
    'settings.bgmOn': 'Enable background music during play',
    'settings.gameplay': 'Board Preferences',
    'settings.showLegal': 'Show legal move indicators',
    'settings.showCoords': 'Show board coordinates (a–h, 1–8)',
    'settings.autoFlip': 'Auto-flip board each turn (2-Player mode)',
    'settings.cloudEval': 'Use Lichess Cloud Evaluation when online',
    'settings.engine': 'Engine: {engine} · Device: {device} · Threads: {threads} · Depth: {depth}',
    'settings.mobile': 'Mobile', 'settings.desktop': 'Desktop',

    'profile.title': 'PLAYER PROFILE',
    'profile.intro': 'Set player names and Elo ratings. Stored in your browser and embedded into PGN / JSON game files.',
    'profile.p1': 'PLAYER 1', 'profile.p2': 'PLAYER 2 (2-PLAYER MODE)',
    'profile.name': 'Display Name', 'profile.elo': 'Elo Rating',
    'profile.saved': 'Player profile updated.',

    'status.idle': 'Choose a game mode from the menu to begin.',
    'status.yourTurn': 'Your turn to move ({color}).',
    'status.turnOf': '{name} to move ({color}).',
    'status.botThinking': '{name} is thinking...',
    'status.check': 'Check!',
    'status.checkmate': 'Checkmate! {winner} wins.',
    'status.draw': 'Draw ({reason}).',
    'status.timeout': 'Time out! {winner} wins.',
    'status.resigned': '{loser} resigned. {winner} wins.',
    'status.reviewing': 'Game Review — Move {ply}/{total}.',
    'status.puzzle': 'Puzzle: {title} — {color} to move.',
    'status.analyzing': 'Analyzing game moves...',
    'status.engineLoading': 'Initializing chess engine...',
    'status.engineReady': 'Engine ready ({engine}).',
    'draw.stalemate': 'Stalemate',
    'draw.repetition': 'Threefold Repetition',
    'draw.insufficient': 'Insufficient Material',
    'draw.fifty': '50-Move Rule',
    'draw.generic': 'Mutual Agreement',

    'go.win': 'VICTORY', 'go.lose': 'DEFEAT', 'go.draw': 'DRAW', 'go.over': 'GAME OVER',
    'go.text': '{result} ({score}). Open Game Review to inspect move accuracy and key turning points.',

    'cls.brilliant': 'Brilliant',
    'cls.best': 'Best Move',
    'cls.great': 'Great Move',
    'cls.book': 'Book Move',
    'cls.good': 'Good Move',
    'cls.inaccuracy': 'Inaccuracy',
    'cls.mistake': 'Mistake',
    'cls.blunder': 'Blunder',

    'coach.idle': 'Make a move on the board to see move evaluation and best-move suggestions.',
    'coach.off': 'Analysis is currently hidden. Click the [ANALYSIS] button above to display move evaluations and recommendations.',
    'coach.thinking': 'Analyzing {move}...',
    'coach.ready': '{color} to move.',
    'coach.optimalIs': 'Best move: {move}',
    'coach.optimalShown': 'The cyan arrow on the board highlights the best move {move}.',
    'coach.botMove': '{name} played {move}.',
    'coach.evalNow': 'Current evaluation: {eval}.',
    'coach.moveFmt': '{san}',
    'coach.moveFmtCastleK': 'O-O',
    'coach.moveFmtCastleQ': 'O-O-O',
    'coach.drop': '{drop} eval drop',
    'coach.gain': 'keeps the evaluation at {eval}',
    'coach.join': ' and ',
    'coach.reasonDrop': '{reason} ({drop} eval drop).',
    'coach.reasonEnd': '{reason}.',

    'r.brilliant': 'A sound tactical sacrifice of the {piece} that seizes a decisive initiative.',
    'r.great': 'Finds the only critical resource that holds the position together.',
    'r.best': 'Matches the engine\'s top choice.',
    'r.bestAlt': 'An accurate move, practically equivalent to the engine\'s top choice ({best}).',
    'r.book': 'Standard opening theory.',
    'r.good': 'A solid move that maintains the position.',
    'r.hangs': 'This move leaves the {piece} on {square} vulnerable to {reply}',
    'r.movedIntoAttack': 'This move places the {piece} on {square} where it can be captured by {reply}',
    'r.allowsMate': 'This move allows a forced mate in {n} starting with {reply}',
    'r.missedMate': 'Missed a forced checkmate in {n}',
    'r.missedCapture': 'Missed the opportunity to capture the {piece} on {square}',
    'r.tacticalLoss': 'Allows the tactical sequence {pv}, losing the {piece}',
    'r.allowsFork': 'Allows {reply}, creating a double attack on the {targets}',
    'r.allowsCheck': 'Exposes the King to {reply}, surrendering the initiative',
    'r.allowsThreat': 'Allows {reply}, directly threatening the {piece} on {square}',
    'r.counterplay': 'Cedes tempo and allows opponent counterplay with {pv}',
    'r.center': 'This move surrenders central control',
    'r.kingSafety': 'This move weakens the pawn shelter around the King',
    'r.passive': 'A passive move that cedes the initiative',
    'r.lostAdvantage': 'This move lets a significant part of the advantage slip',
    'r.generic': 'This move is less accurate than the principal continuation',

    'p.mate': 'Forces checkmate in {n} moves.',
    'p.promote': 'Promotes the pawn to gain decisive material.',
    'p.fork': 'Creates a double attack threatening the {targets}.',
    'p.capture': 'Captures the {piece} on {square}, winning material.',
    'p.trade': 'Trades the {piece} on {square} to simplify favorably.',
    'p.evade': 'Moves the threatened {piece} to safety on {square}.',
    'p.defend': 'Timely defense of the threatened {piece} on {square}.',
    'p.check': 'Delivers check with the {piece} to seize the initiative.',
    'p.threat': 'Places the {piece} on {square}, directly threatening the {target} on {tsq}.',
    'p.castle': 'Castles the King to safety and activates the Rook.',
    'p.pawnPush': 'Advances the pawn to {square} to gain space and create pressure.',
    'p.openFile': 'Takes control of a key line with the {piece} on {square}.',
    'p.center': 'Places the {piece} on {square} to control the center.',
    'p.develop': 'Develops the {piece} to an active post on {square}.',
    'p.kingActive': 'Activates the King to {square} to support the endgame.',
    'p.positional': 'Improves the {piece} to {square} and keeps the position solid.',
    'p.altNote': 'Practically equivalent to {best}: {purpose}',
    'p.pvPlan': 'Expected continuation: {pv}.',

    'b.mate': 'Best move was {move}, forcing checkmate in {n}.',
    'b.fork': 'Best move was {move}, creating a double attack on the {targets}.',
    'b.capture': 'Best move was {move}, winning the {piece}.',
    'b.promote': 'Best move was {move}, promoting the pawn.',
    'b.check': 'Best move was {move}, delivering check and gaining tempo.',
    'b.evade': 'Best move was {move}, moving the {piece} to safety on {square}.',
    'b.threat': 'Best move was {move}, threatening the {target} on {tsq}.',
    'b.tacticPv': 'Best move was {move}, initiating the sequence {pv} for an advantage.',
    'b.positionalSq': 'Best move was {move}, placing the {piece} on {square} to control the position (continuation: {pv}).',
    'b.castle': 'Best move was {move}, castling the King to safety.',
    'b.center': 'Best move was {move}, contesting the center.',
    'b.develop': 'Best move was {move}, developing a piece with tempo.',
    'b.defend': 'Best move was {move}, defending the {piece} on {square}.',
    'b.generic': 'Best move was {move} to improve piece activity and pressure.',
    'b.whyBetter': '{move} keeps the evaluation at {eval} instead of {played}.',

    'review.accuracy': 'ACCURACY',
    'review.analyzing': 'Analyzing move {i}/{n}...',
    'review.done': 'Game Review complete. Click [>> NEXT KEY MOVE] to jump through critical moments.',
    'review.noCritical': 'No further key moves ahead.',
    'review.start': 'Starting position.',
    'review.playedArrow': 'Orange arrow: played move. Cyan arrow: best move.',
    'review.playedArrowRed': 'Red arrow: played move. Cyan arrow: best move.',
    'review.needGame': 'No moves available to analyze.',
    'review.moveHeader': 'Move {no}{dots} {san}',

    'puzzle.all': 'All Topics (100)',
    'puzzle.progress': 'Solved: {s}/{n}',
    'puzzle.toMove': '{color} to move',
    'puzzle.correct': 'Correct! Keep going...',
    'puzzle.wrong': '{move} is not the correct continuation. Try again!',
    'puzzle.solved': 'Puzzle solved! Well done.',
    'puzzle.hint': 'Hint: Look at the {piece} on {square}.',
    'puzzle.canonicalStep': 'Move {i}/{n}: {move}',
    'puzzle.canonicalDone': 'Full solution line displayed.',
    'puzzle.select': 'Select a puzzle from the list to begin.',
    'puzzle.rating': 'Rating {r}',
    'puzzle.source': 'Game: {s}',

    'archive.empty': 'No saved games in browser storage yet.',
    'archive.saved': 'Game saved to browser storage.',
    'archive.deleted': 'Saved game deleted.',
    'archive.imported': 'Game file loaded successfully.',
    'archive.importFail': 'Invalid game file format.',
    'archive.exported': 'Downloaded {file}.',
    'archive.vs': '{w} ({we}) vs {b} ({be})',
    'archive.moves': '{n} plies',
    'alert.confirmResign': 'Are you sure you want to resign this game?',
    'alert.confirmNew': 'Starting a new game will end the current match. Continue?',
    'alert.noMoves': 'No moves played yet.',
    'alert.engineFail': 'Stockfish Worker unavailable; using fallback engine.',
    'alert.takebackNA': 'Takeback is not available right now.',
    'alert.pausedNA': 'Not available while paused.',
    'alert.illegal': 'Illegal move.',

    'piece.p': 'Pawn', 'piece.n': 'Knight', 'piece.b': 'Bishop', 'piece.r': 'Rook', 'piece.q': 'Queen', 'piece.k': 'King',
    'piece.pl.p': 'pawn', 'piece.pl.n': 'knight', 'piece.pl.b': 'bishop', 'piece.pl.r': 'rook', 'piece.pl.q': 'queen', 'piece.pl.k': 'king'
  };

  function readInitialLang() {
    try {
      const s = JSON.parse(localStorage.getItem('yorha_chess_settings') || '{}');
      if (s.lang === 'en' || s.lang === 'vi') return s.lang;
    } catch (e) { /* ignore */ }
    return 'vi';
  }

  const listeners = [];

  const I18N = {
    lang: readInitialLang(),
    dict: { vi, en },
    CLASS_SYMBOL,

    t(key, params) {
      let s = (this.dict[this.lang] && this.dict[this.lang][key]);
      if (s == null) s = this.dict.en[key];
      if (s == null) return key;
      if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? params[k] : m));
      return s;
    },

    pick(obj) {
      if (obj == null) return '';
      if (typeof obj === 'string') return obj;
      return obj[this.lang] != null ? obj[this.lang] : (obj.en != null ? obj.en : '');
    },

    pieceName(type) { return this.t('piece.' + String(type).toLowerCase()); },
    classLabel(cls) { return this.t('cls.' + cls); },

    apply(root) {
      root = root || document;
      root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = this.t(el.getAttribute('data-i18n')); });
      root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = this.t(el.getAttribute('data-i18n-html')); });
      root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = this.t(el.getAttribute('data-i18n-title')); });
      root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = this.t(el.getAttribute('data-i18n-placeholder')); });
      if (root === document) document.documentElement.lang = this.lang;
    },

    setLang(lang) {
      if (lang !== 'vi' && lang !== 'en') return;
      this.lang = lang;
      if (window.YStorage) window.YStorage.saveSettings({ lang });
      this.apply(document);
      listeners.forEach(cb => { try { cb(lang); } catch (e) { console.error(e); } });
    },

    onChange(cb) { listeners.push(cb); }
  };

  window.I18N = I18N;
})();
