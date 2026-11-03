/* =====================================================================
   YoRHa Tactical Chess System — i18n.js
   Global: I18N  — bilingual (vi default / en) localization engine.
   ===================================================================== */
(function () {
  'use strict';

  const CLASS_SYMBOL = {
    brilliant: '!!', best: '★', great: '!', book: 'BOOK', good: 'GOOD',
    inaccuracy: '?!', mistake: '?', blunder: '??'
  };

  const vi = {
    /* ---------- UI ---------- */
    'ui.subtitle': 'HỆ THỐNG CỜ VUA CHIẾN THUẬT // UNIT 2B',
    'ui.newOperation': 'THIẾT LẬP TÁC CHIẾN',
    'ui.gameMode': 'Chế độ',
    'ui.selectOpponent': 'Chọn đối thủ',
    'ui.yourColor': 'Quân của bạn',
    'ui.white': 'TRẮNG', 'ui.black': 'ĐEN', 'ui.random': 'NGẪU NHIÊN',
    'ui.timeControl': 'Thời gian',
    'ui.opponentUnit': 'ĐƠN VỊ ĐỐI THỦ',
    'ui.liveEval': 'ĐÁNH GIÁ TRỰC TIẾP',
    'ui.coachHud': 'TRỢ LÝ CHIẾN THUẬT // POD 042',
    'ui.evaluation': 'Đánh giá',
    'ui.movesReview': 'BIÊN BẢN & PHÂN TÍCH',
    'ui.puzzleLib': 'THƯ VIỆN CÂU ĐỐ',
    'ui.archive': 'KHO LƯU TRỮ TRẬN ĐẤU',
    'ui.promotion': 'PHONG CẤP',
    'ui.you': 'Bạn', 'ui.bot': 'Bot',
    'ui.whiteSide': 'Trắng', 'ui.blackSide': 'Đen',
    'ui.source.cloud': 'NGUỒN: LICHESS CLOUD',
    'ui.source.stockfish': 'NGUỒN: STOCKFISH WORKER',
    'ui.source.mini': 'NGUỒN: MINI-ENGINE NỘI BỘ',
    'ui.depth': 'độ sâu {d}',

    'mode.bot': 'ĐẤU VỚI BOT', 'mode.pvp': '2 NGƯỜI / 1 MÁY', 'mode.puzzle': 'CÂU ĐỐ', 'mode.review': 'PHÂN TÍCH',
    'tab.coach': 'COACH', 'tab.moves': 'NƯỚC ĐI / PHÂN TÍCH', 'tab.puzzles': 'CÂU ĐỐ', 'tab.archive': 'LƯU TRỮ',
    'mtab.coach': '[ COACH ]', 'mtab.moves': '[ NƯỚC ĐI ]', 'mtab.puzzles': '[ CÂU ĐỐ ]', 'mtab.settings': '[ CÀI ĐẶT ]',

    /* ---------- Buttons ---------- */
    'btn.profile': 'HỒ SƠ', 'btn.settings': 'CÀI ĐẶT',
    'btn.start': '[ BẮT ĐẦU TÁC CHIẾN ]', 'btn.new': 'VÁN MỚI', 'btn.flip': 'XOAY BÀN',
    'btn.takeback': 'ĐI LẠI', 'btn.resign': 'ĐẦU HÀNG',
    'btn.showOptimal': '[ ĐỀ XUẤT NƯỚC TỐI ƯU ]', 'btn.hideOptimal': '[ ẨN NƯỚC TỐI ƯU ]',
    'btn.coachTakeback': '[ ĐI LẠI ]',
    'btn.back': '< LÙI', 'btn.next': 'TIẾN >',
    'btn.nextCritical': '[ >> NƯỚC QUAN TRỌNG TIẾP THEO ]',
    'btn.analyze': 'PHÂN TÍCH TRẬN', 'btn.save': 'LƯU TRÌNH DUYỆT', 'btn.export': 'TẢI .JSON', 'btn.import': 'NHẬP .JSON',
    'btn.hint': 'GỢI Ý', 'btn.retry': 'THỬ LẠI', 'btn.canonical': '[ XEM NƯỚC CHUẨN LỊCH SỬ ]',
    'btn.canonicalNext': '[ BƯỚC TIẾP > ]', 'btn.nextPuzzle': 'CÂU TIẾP >',
    'btn.close': 'ĐÓNG', 'btn.confirm': 'XÁC NHẬN', 'btn.cancel': 'HỦY',
    'btn.review': '[ PHÂN TÍCH SAU TRẬN ]', 'btn.load': 'MỞ', 'btn.delete': 'XÓA',
    'btn.favorite': '☆ YÊU THÍCH', 'btn.unfavorite': '★ BỎ THÍCH',

    'tc.none': 'Không giới hạn',

    /* ---------- Settings / Profile ---------- */
    'settings.title': 'CÀI ĐẶT HỆ THỐNG',
    'settings.language': 'Ngôn ngữ / Language',
    'settings.audio': 'Âm thanh',
    'settings.audioOn': 'Bật hiệu ứng âm thanh',
    'settings.gameplay': 'Lối chơi',
    'settings.showLegal': 'Hiển thị nước đi hợp lệ',
    'settings.showCoords': 'Hiển thị tọa độ',
    'settings.autoFlip': 'Tự động xoay bàn cờ mỗi lượt (2 người)',
    'settings.cloudEval': 'Dùng Lichess Cloud Eval khi online',
    'settings.engine': 'ENGINE: {engine} // THIẾT BỊ: {device} // LUỒNG: {threads} // ĐỘ SÂU: {depth} // THỜI GIAN: {movetime}ms',
    'settings.mobile': 'DI ĐỘNG', 'settings.desktop': 'MÁY TÍNH',

    'profile.title': 'HỒ SƠ ĐƠN VỊ',
    'profile.intro': 'Nhập danh tính chiến binh trước khi xuất kích. Dữ liệu được lưu trong bộ nhớ trình duyệt và ghi vào mỗi biên bản trận đấu.',
    'profile.p1': 'NGƯỜI CHƠI 1', 'profile.p2': 'NGƯỜI CHƠI 2 (CHẾ ĐỘ 2 NGƯỜI)',
    'profile.name': 'Tên', 'profile.elo': 'Elo hiện tại',
    'profile.saved': 'ĐÃ CẬP NHẬT HỒ SƠ ĐƠN VỊ.',

    /* ---------- Status ---------- */
    'status.idle': 'HỆ THỐNG SẴN SÀNG. CHỌN CHẾ ĐỘ ĐỂ BẮT ĐẦU.',
    'status.yourTurn': 'LƯỢT CỦA BẠN ({color}).',
    'status.turnOf': 'LƯỢT CỦA {name} ({color}).',
    'status.botThinking': '{name} ĐANG TÍNH TOÁN...',
    'status.check': 'CHIẾU! VUA ĐANG BỊ ĐE DỌA.',
    'status.checkmate': 'CHIẾU BÍ! {winner} CHIẾN THẮNG.',
    'status.draw': 'HÒA CỜ: {reason}.',
    'status.timeout': 'HẾT GIỜ! {winner} CHIẾN THẮNG.',
    'status.resigned': '{loser} ĐẦU HÀNG. {winner} CHIẾN THẮNG.',
    'status.reviewing': 'CHẾ ĐỘ PHÂN TÍCH SAU TRẬN. NƯỚC {ply}/{total}.',
    'status.puzzle': 'CÂU ĐỐ: {title} — {color} ĐI.',
    'status.analyzing': 'ĐANG PHÂN TÍCH TOÀN BỘ VÁN ĐẤU...',
    'status.engineLoading': 'ĐANG KHỞI ĐỘNG ENGINE...',
    'status.engineReady': 'ENGINE TRỰC TUYẾN: {engine}.',
    'draw.stalemate': 'HẾT NƯỚC ĐI (PAT)',
    'draw.repetition': 'LẶP LẠI 3 LẦN',
    'draw.insufficient': 'KHÔNG ĐỦ QUÂN CHIẾU BÍ',
    'draw.fifty': 'LUẬT 50 NƯỚC',
    'draw.generic': 'THỎA THUẬN',

    'go.win': 'NHIỆM VỤ HOÀN THÀNH', 'go.lose': 'NHIỆM VỤ THẤT BẠI', 'go.draw': 'BẤT PHÂN THẮNG BẠI', 'go.over': 'KẾT THÚC TRẬN ĐẤU',
    'go.text': '{result}. Kết quả: {score}. Chọn [PHÂN TÍCH SAU TRẬN] để xem đánh giá chi tiết từng nước đi.',

    /* ---------- Classification ---------- */
    'cls.brilliant': 'Nước đi Thiên tài',
    'cls.best': 'Nước Tốt nhất',
    'cls.great': 'Nước đi Tuyệt vời',
    'cls.book': 'Nước Sách giáo khoa',
    'cls.good': 'Nước đi Tốt',
    'cls.inaccuracy': 'Nước đi Hơi non',
    'cls.mistake': 'Nước đi Sai lầm',
    'cls.blunder': 'Nước đi Ngớ ngẩn / Blunder',

    /* ---------- Coach ---------- */
    'coach.idle': 'Pod 042 đang chờ dữ liệu. Thực hiện nước đi để nhận đánh giá.',
    'coach.off': 'Đánh giá trực tiếp đang TẮT. Bật [ĐÁNH GIÁ TRỰC TIẾP] để Pod 042 phân tích từng nước đi.',
    'coach.thinking': 'Pod 042 đang phân tích nước {move}...',
    'coach.ready': 'Đã quét xong thế cờ. Đến lượt {color}.',
    'coach.optimalIs': 'Nước tối ưu: {move}',
    'coach.optimalShown': 'Mũi tên xanh trên bàn cờ chỉ nước tối ưu {move}.',
    'coach.botMove': '{name} vừa đi {move}.',
    'coach.evalNow': 'Thế cờ hiện tại: {eval}.',
    'coach.moveFmt': '{piece} {from} → {to}',
    'coach.moveFmtCastleK': 'Nhập thành cánh Vua (O-O)',
    'coach.moveFmtCastleQ': 'Nhập thành cánh Hậu (O-O-O)',
    'coach.drop': 'tụt {drop} điểm',
    'coach.gain': 'giữ thế cờ ở mức {eval}',
    'coach.join': ' và ',
    'coach.reasonDrop': '{reason} và tụt {drop} điểm.',
    'coach.reasonEnd': '{reason}.',

    // reasons about the played move
    'r.brilliant': 'Bạn hy sinh {piece} một cách chính xác mà đối thủ không thể khai thác — đúng tinh thần một chiến binh YoRHa.',
    'r.great': 'Đây gần như là nước đi duy nhất giữ được thế trận — mọi phương án khác đều tệ hơn đáng kể.',
    'r.best': 'Trùng khớp với nước tối ưu của engine.',
    'r.book': 'Nước đi nằm trong lý thuyết khai cuộc chuẩn mực.',
    'r.good': 'Nước đi chắc chắn, chỉ kém nước tối ưu một chút.',
    'r.hangs': 'Nước đi này để {piece} ở {square} bị bỏ ngỏ — đối thủ có thể đáp {reply}',
    'r.allowsMate': 'Nước này cho phép đối thủ chiếu bí trong {n} nước (bắt đầu bằng {reply})',
    'r.missedMate': 'Bạn đã bỏ lỡ chuỗi chiếu bí trong {n} nước',
    'r.missedCapture': 'Bạn bỏ lỡ cơ hội ăn {piece} ở {square}',
    'r.center': 'Nước đi này làm mất quyền kiểm soát trung tâm',
    'r.kingSafety': 'Nước đi này làm suy yếu hàng rào bảo vệ Vua',
    'r.passive': 'Nước đi thụ động, trao quyền chủ động cho đối thủ',
    'r.lostAdvantage': 'Nước đi này đánh mất lợi thế đang có',
    'r.generic': 'Nước đi này làm xấu đi thế trận',

    // reasons about the best move
    'b.mate': 'Nước tối ưu là {move} dẫn tới chiếu bí trong {n} nước.',
    'b.fork': 'Nước tối ưu là {move} để chĩa đôi {targets}.',
    'b.capture': 'Nước tối ưu là {move} để ăn {piece}.',
    'b.promote': 'Nước tối ưu là {move} để phong cấp thành Hậu.',
    'b.check': 'Nước tối ưu là {move} — chiếu Vua và giành thế chủ động.',
    'b.castle': 'Nước tối ưu là {move} để đưa Vua vào nơi an toàn.',
    'b.center': 'Nước tối ưu là {move} để chiếm lĩnh trung tâm.',
    'b.develop': 'Nước tối ưu là {move} để phát triển quân và tăng sức ép.',
    'b.defend': 'Nước tối ưu là {move} để bảo vệ {piece} ở {square}.',
    'b.generic': 'Nước tối ưu là {move} để chĩa đôi hoặc gây sức ép chiến thuật.',
    'b.whyBetter': 'Nước {move} tốt hơn vì giữ đánh giá ở mức {eval} thay vì {played}.',

    /* ---------- Review ---------- */
    'review.accuracy': 'ĐỘ CHÍNH XÁC',
    'review.analyzing': 'ĐANG PHÂN TÍCH {i}/{n}',
    'review.done': 'PHÂN TÍCH HOÀN TẤT. Dùng [>> NƯỚC QUAN TRỌNG TIẾP THEO] để nhảy tới các khoảnh khắc then chốt.',
    'review.noCritical': 'Không còn nước quan trọng nào phía sau.',
    'review.start': 'Thế cờ ban đầu.',
    'review.playedArrow': 'Mũi tên cam: nước đã đi. Mũi tên xanh: nước tối ưu.',
    'review.needGame': 'Chưa có ván đấu nào để phân tích.',
    'review.moveHeader': 'Nước {no}{dots} {san}',

    /* ---------- Puzzles ---------- */
    'puzzle.all': 'TẤT CẢ DANH MỤC',
    'puzzle.progress': 'ĐÃ GIẢI {s}/{n}',
    'puzzle.toMove': '{color} đi',
    'puzzle.correct': 'CHÍNH XÁC! Tiếp tục...',
    'puzzle.wrong': 'CHƯA ĐÚNG. Nước {move} không phải lời giải. Thử lại!',
    'puzzle.solved': 'HOÀN THÀNH NHIỆM VỤ! Câu đố đã được giải.',
    'puzzle.hint': 'GỢI Ý: Hãy chú ý quân {piece} ở {square}.',
    'puzzle.canonicalStep': 'Bước {i}/{n}: {move}',
    'puzzle.canonicalDone': 'Đã trình chiếu toàn bộ lời giải chuẩn.',
    'puzzle.select': 'Chọn một câu đố trong danh sách để bắt đầu.',
    'puzzle.rating': 'Độ khó {r}',
    'puzzle.source': 'Nguồn: {s}',

    /* ---------- Archive / alerts ---------- */
    'archive.empty': 'Chưa có trận đấu nào được lưu.',
    'archive.saved': 'ĐÃ LƯU TRẬN ĐẤU VÀO KHO TRÌNH DUYỆT.',
    'archive.deleted': 'ĐÃ XÓA BIÊN BẢN.',
    'archive.imported': 'ĐÃ NHẬP FILE TRẬN ĐẤU. ĐANG MỞ CHẾ ĐỘ PHÂN TÍCH.',
    'archive.importFail': 'FILE KHÔNG HỢP LỆ. KHÔNG THỂ NHẬP.',
    'archive.exported': 'ĐÃ TẢI FILE {file}.',
    'archive.vs': '{w} ({we}) vs {b} ({be})',
    'archive.moves': '{n} nước',
    'alert.confirmResign': 'Xác nhận đầu hàng?',
    'alert.confirmNew': 'Ván đấu hiện tại sẽ bị hủy. Tiếp tục?',
    'alert.noMoves': 'Chưa có nước đi nào.',
    'alert.engineFail': 'Không tải được Stockfish. Đang dùng Mini-Engine nội bộ.',
    'alert.takebackNA': 'Không thể đi lại lúc này.',
    'alert.illegal': 'NƯỚC ĐI KHÔNG HỢP LỆ.',

    /* ---------- Pieces ---------- */
    'piece.p': 'Tốt', 'piece.n': 'Mã', 'piece.b': 'Tượng', 'piece.r': 'Xe', 'piece.q': 'Hậu', 'piece.k': 'Vua',
    'piece.pl.p': 'Tốt', 'piece.pl.n': 'Mã', 'piece.pl.b': 'Tượng', 'piece.pl.r': 'Xe', 'piece.pl.q': 'Hậu', 'piece.pl.k': 'Vua'
  };

  const en = {
    'ui.subtitle': 'TACTICAL CHESS COMMAND // UNIT 2B',
    'ui.newOperation': 'NEW OPERATION',
    'ui.gameMode': 'Game mode',
    'ui.selectOpponent': 'Select opponent',
    'ui.yourColor': 'Your side',
    'ui.white': 'WHITE', 'ui.black': 'BLACK', 'ui.random': 'RANDOM',
    'ui.timeControl': 'Time control',
    'ui.opponentUnit': 'OPPONENT UNIT',
    'ui.liveEval': 'LIVE EVALUATION',
    'ui.coachHud': 'TACTICAL SUPPORT // POD 042',
    'ui.evaluation': 'Evaluation',
    'ui.movesReview': 'MOVE LOG & REVIEW',
    'ui.puzzleLib': 'PUZZLE LIBRARY',
    'ui.archive': 'MATCH ARCHIVE',
    'ui.promotion': 'PROMOTION',
    'ui.you': 'You', 'ui.bot': 'Bot',
    'ui.whiteSide': 'White', 'ui.blackSide': 'Black',
    'ui.source.cloud': 'SOURCE: LICHESS CLOUD',
    'ui.source.stockfish': 'SOURCE: STOCKFISH WORKER',
    'ui.source.mini': 'SOURCE: INTERNAL MINI-ENGINE',
    'ui.depth': 'depth {d}',

    'mode.bot': 'PLAY VS BOT', 'mode.pvp': '2 PLAYERS / 1 DEVICE', 'mode.puzzle': 'PUZZLE', 'mode.review': 'REVIEW',
    'tab.coach': 'COACH', 'tab.moves': 'MOVES / REVIEW', 'tab.puzzles': 'PUZZLES', 'tab.archive': 'ARCHIVE',
    'mtab.coach': '[ COACH ]', 'mtab.moves': '[ MOVES ]', 'mtab.puzzles': '[ PUZZLES ]', 'mtab.settings': '[ SETTINGS ]',

    'btn.profile': 'PROFILE', 'btn.settings': 'SETTINGS',
    'btn.start': '[ BEGIN OPERATION ]', 'btn.new': 'NEW GAME', 'btn.flip': 'FLIP',
    'btn.takeback': 'TAKEBACK', 'btn.resign': 'RESIGN',
    'btn.showOptimal': '[ SHOW OPTIMAL MOVE ]', 'btn.hideOptimal': '[ HIDE OPTIMAL MOVE ]',
    'btn.coachTakeback': '[ TAKEBACK ]',
    'btn.back': '< BACK', 'btn.next': 'NEXT >',
    'btn.nextCritical': '[ >> NEXT CRITICAL MOVE ]',
    'btn.analyze': 'ANALYZE GAME', 'btn.save': 'SAVE TO BROWSER', 'btn.export': 'DOWNLOAD .JSON', 'btn.import': 'IMPORT .JSON',
    'btn.hint': 'HINT', 'btn.retry': 'RETRY', 'btn.canonical': '[ VIEW CANONICAL SOLUTION ]',
    'btn.canonicalNext': '[ NEXT STEP > ]', 'btn.nextPuzzle': 'NEXT PUZZLE >',
    'btn.close': 'CLOSE', 'btn.confirm': 'CONFIRM', 'btn.cancel': 'CANCEL',
    'btn.review': '[ POST-GAME REVIEW ]', 'btn.load': 'OPEN', 'btn.delete': 'DELETE',
    'btn.favorite': '☆ FAVORITE', 'btn.unfavorite': '★ UNFAVORITE',

    'tc.none': 'Unlimited',

    'settings.title': 'SYSTEM SETTINGS',
    'settings.language': 'Language / Ngôn ngữ',
    'settings.audio': 'Audio',
    'settings.audioOn': 'Enable sound effects',
    'settings.gameplay': 'Gameplay',
    'settings.showLegal': 'Show legal moves',
    'settings.showCoords': 'Show coordinates',
    'settings.autoFlip': 'Auto-flip board each turn (2 players)',
    'settings.cloudEval': 'Use Lichess Cloud Eval when online',
    'settings.engine': 'ENGINE: {engine} // DEVICE: {device} // THREADS: {threads} // DEPTH: {depth} // MOVETIME: {movetime}ms',
    'settings.mobile': 'MOBILE', 'settings.desktop': 'DESKTOP',

    'profile.title': 'UNIT PROFILE',
    'profile.intro': 'Register your combat identity before deployment. Data is cached in your browser and embedded into every match record.',
    'profile.p1': 'PLAYER 1', 'profile.p2': 'PLAYER 2 (2-PLAYER MODE)',
    'profile.name': 'Name', 'profile.elo': 'Current Elo',
    'profile.saved': 'UNIT PROFILE UPDATED.',

    'status.idle': 'SYSTEM READY. SELECT A MODE TO BEGIN.',
    'status.yourTurn': 'YOUR MOVE ({color}).',
    'status.turnOf': '{name} TO MOVE ({color}).',
    'status.botThinking': '{name} IS CALCULATING...',
    'status.check': 'CHECK! THE KING IS UNDER ATTACK.',
    'status.checkmate': 'CHECKMATE! {winner} WINS.',
    'status.draw': 'DRAW: {reason}.',
    'status.timeout': 'TIME OUT! {winner} WINS.',
    'status.resigned': '{loser} RESIGNED. {winner} WINS.',
    'status.reviewing': 'POST-GAME REVIEW. MOVE {ply}/{total}.',
    'status.puzzle': 'PUZZLE: {title} — {color} TO MOVE.',
    'status.analyzing': 'ANALYZING THE ENTIRE GAME...',
    'status.engineLoading': 'BOOTING ENGINE...',
    'status.engineReady': 'ENGINE ONLINE: {engine}.',
    'draw.stalemate': 'STALEMATE',
    'draw.repetition': 'THREEFOLD REPETITION',
    'draw.insufficient': 'INSUFFICIENT MATERIAL',
    'draw.fifty': '50-MOVE RULE',
    'draw.generic': 'AGREEMENT',

    'go.win': 'MISSION COMPLETE', 'go.lose': 'MISSION FAILED', 'go.draw': 'STALEMATED OPERATION', 'go.over': 'MATCH CONCLUDED',
    'go.text': '{result}. Score: {score}. Choose [POST-GAME REVIEW] for a detailed move-by-move evaluation.',

    'cls.brilliant': 'Brilliant',
    'cls.best': 'Best Move',
    'cls.great': 'Great Move',
    'cls.book': 'Book Move',
    'cls.good': 'Good Move',
    'cls.inaccuracy': 'Inaccuracy',
    'cls.mistake': 'Mistake',
    'cls.blunder': 'Blunder',

    'coach.idle': 'Pod 042 awaiting data. Make a move to receive an evaluation.',
    'coach.off': 'Live evaluation is OFF. Enable [LIVE EVALUATION] to let Pod 042 analyze every move.',
    'coach.thinking': 'Pod 042 analyzing {move}...',
    'coach.ready': 'Position scanned. {color} to move.',
    'coach.optimalIs': 'Optimal move: {move}',
    'coach.optimalShown': 'The cyan arrow on the board marks the optimal move {move}.',
    'coach.botMove': '{name} played {move}.',
    'coach.evalNow': 'Current position: {eval}.',
    'coach.moveFmt': '{piece} {from} → {to}',
    'coach.moveFmtCastleK': 'Kingside castling (O-O)',
    'coach.moveFmtCastleQ': 'Queenside castling (O-O-O)',
    'coach.drop': '{drop} eval drop',
    'coach.gain': 'keeps the evaluation at {eval}',
    'coach.join': ' and ',
    'coach.reasonDrop': '{reason} ({drop} eval drop).',
    'coach.reasonEnd': '{reason}.',

    'r.brilliant': 'You sacrificed your {piece} with precision and the opponent cannot exploit it — true YoRHa spirit.',
    'r.great': 'This was practically the only move that holds the position — every alternative is significantly worse.',
    'r.best': 'Matches the engine\'s optimal move.',
    'r.book': 'A standard theoretical opening move.',
    'r.good': 'A solid move, only slightly below the optimal line.',
    'r.hangs': 'This move leaves your {piece} on {square} exposed — the opponent can answer {reply}',
    'r.allowsMate': 'This move allows a forced mate in {n} (starting with {reply})',
    'r.missedMate': 'You missed a forced mate in {n}',
    'r.missedCapture': 'You missed the chance to win the {piece} on {square}',
    'r.center': 'This move surrenders central control',
    'r.kingSafety': 'This move weakens your king\'s shelter',
    'r.passive': 'A passive move that hands the initiative to your opponent',
    'r.lostAdvantage': 'This move throws away your advantage',
    'r.generic': 'This move worsens your position',

    'b.mate': 'Best move was {move}, forcing mate in {n}.',
    'b.fork': 'Best move was {move}, forking {targets}.',
    'b.capture': 'Best move was {move}, winning the {piece}.',
    'b.promote': 'Best move was {move}, promoting to a Queen.',
    'b.check': 'Best move was {move} — a check that seizes the initiative.',
    'b.castle': 'Best move was {move}, bringing the king to safety.',
    'b.center': 'Best move was {move}, taking control of the center.',
    'b.develop': 'Best move was {move}, developing with pressure.',
    'b.defend': 'Best move was {move}, defending the {piece} on {square}.',
    'b.generic': 'Best move was {move} to apply tactical pressure.',
    'b.whyBetter': '{move} is superior because it keeps the evaluation at {eval} instead of {played}.',

    'review.accuracy': 'ACCURACY',
    'review.analyzing': 'ANALYZING {i}/{n}',
    'review.done': 'ANALYSIS COMPLETE. Use [>> NEXT CRITICAL MOVE] to jump to the turning points.',
    'review.noCritical': 'No further critical moves.',
    'review.start': 'Starting position.',
    'review.playedArrow': 'Orange arrow: move played. Cyan arrow: optimal move.',
    'review.needGame': 'No game available to review.',
    'review.moveHeader': 'Move {no}{dots} {san}',

    'puzzle.all': 'ALL CATEGORIES',
    'puzzle.progress': 'SOLVED {s}/{n}',
    'puzzle.toMove': '{color} to move',
    'puzzle.correct': 'CORRECT! Keep going...',
    'puzzle.wrong': 'NOT QUITE. {move} is not the solution. Try again!',
    'puzzle.solved': 'MISSION COMPLETE! Puzzle solved.',
    'puzzle.hint': 'HINT: Look at the {piece} on {square}.',
    'puzzle.canonicalStep': 'Step {i}/{n}: {move}',
    'puzzle.canonicalDone': 'Canonical solution fully replayed.',
    'puzzle.select': 'Select a puzzle from the list to begin.',
    'puzzle.rating': 'Rating {r}',
    'puzzle.source': 'Source: {s}',

    'archive.empty': 'No matches saved yet.',
    'archive.saved': 'MATCH SAVED TO BROWSER ARCHIVE.',
    'archive.deleted': 'RECORD DELETED.',
    'archive.imported': 'MATCH FILE IMPORTED. OPENING POST-GAME REVIEW.',
    'archive.importFail': 'INVALID FILE. IMPORT FAILED.',
    'archive.exported': 'DOWNLOADED {file}.',
    'archive.vs': '{w} ({we}) vs {b} ({be})',
    'archive.moves': '{n} moves',
    'alert.confirmResign': 'Confirm resignation?',
    'alert.confirmNew': 'The current game will be discarded. Continue?',
    'alert.noMoves': 'No moves yet.',
    'alert.engineFail': 'Stockfish failed to load. Using the internal Mini-Engine.',
    'alert.takebackNA': 'Takeback not available right now.',
    'alert.illegal': 'ILLEGAL MOVE.',

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
