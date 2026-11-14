/* =====================================================================
   Chess System — bots.js
   Global: Bots
   - 7 Elo tiers with Stockfish UCI tuning & human-like think delays
   - Standard chess playing style descriptions (no game lore)
   - Clean chess avatar SVG icons per tier
   - Bilingual (vi / en) standard chess coach/opponent lines
   ===================================================================== */
(function () {
  'use strict';

  const list = [
    {
      id: 'cadet',
      tier: 1,
      elo: 400,
      name: { vi: 'Người Mới', en: 'Beginner' },
      title: { vi: 'Cấp độ 1 // Tập sự', en: 'Level 1 // Novice' },
      desc: {
        vi: 'Mới làm quen với luật cờ. Thường đi quân ngẫu nhiên, ít bảo vệ quân và dễ bỏ sót các đòn bắt quân trực tiếp.',
        en: 'Just learning the rules. Frequently makes loose moves, leaves pieces undefended, and misses simple captures.'
      },
      uci: { skill: 0, limitStrength: true, elo: 400, depth: 3, movetime: 180, multiPV: 4 },
      randomness: 0.68,
      thinkDelay: [260, 580]
    },
    {
      id: 'scout',
      tier: 2,
      elo: 700,
      name: { vi: 'Sơ Cấp', en: 'Casual' },
      title: { vi: 'Cấp độ 2 // Phong trào', en: 'Level 2 // Casual Player' },
      desc: {
        vi: 'Biết phát triển quân nhẹ và nhập thành cơ bản, nhưng tính toán ngắn (1–2 nước) và đôi khi mắc lỗi bỏ quân.',
        en: 'Develops minor pieces and castles, but calculates only 1–2 moves ahead and occasionally hangs material.'
      },
      uci: { skill: 2, limitStrength: true, elo: 700, depth: 5, movetime: 250, multiPV: 4 },
      randomness: 0.45,
      thinkDelay: [300, 680]
    },
    {
      id: 'tactician',
      tier: 3,
      elo: 1000,
      name: { vi: 'Trung Cấp', en: 'Club Player' },
      title: { vi: 'Cấp độ 3 // Câu lạc bộ', en: 'Level 3 // Club Intermediate' },
      desc: {
        vi: 'Nắm vững các đòn chiến thuật cơ bản như chĩa đôi, ghim quân và xiên quân. Khai thác nhanh các nước đi sơ hở.',
        en: 'Spots fundamental tactical motifs such as forks, pins, and skewers. Quickly punishes one-move blunders.'
      },
      uci: { skill: 5, limitStrength: true, elo: 1000, depth: 7, movetime: 360, multiPV: 3 },
      randomness: 0.28,
      thinkDelay: [350, 760]
    },
    {
      id: 'veteran',
      tier: 4,
      elo: 1400,
      name: { vi: 'Khá Giỏi', en: 'Tournament' },
      title: { vi: 'Cấp độ 4 // Đấu giải', en: 'Level 4 // Tournament Player' },
      desc: {
        vi: 'Chơi chắc chắn ở khai cuộc, biết kiểm soát trung tâm, phối hợp các quân nặng trên cột mở và ít khi mất quân không.',
        en: 'Plays solid openings, fights for central control, coordinates rooks on open files, and rarely drops pieces.'
      },
      uci: { skill: 9, limitStrength: true, elo: 1400, depth: 10, movetime: 500, multiPV: 3 },
      randomness: 0.14,
      thinkDelay: [380, 820]
    },
    {
      id: 'master',
      tier: 5,
      elo: 1800,
      name: { vi: 'Kiện Tướng', en: 'Candidate Master' },
      title: { vi: 'Cấp độ 5 // Kiện tướng dự bị', en: 'Level 5 // Candidate Master' },
      desc: {
        vi: 'Tính toán sâu các tổ hợp chiến thuật nhiều nước, đánh giá tốt cấu trúc tốt và chuyển hóa ưu thế nhỏ ở cờ tàn.',
        en: 'Calculates multi-move tactical combinations, understands pawn structures, and converts small endgame edges.'
      },
      uci: { skill: 14, limitStrength: true, elo: 1800, depth: 13, movetime: 750, multiPV: 2 },
      randomness: 0.05,
      thinkDelay: [420, 900]
    },
    {
      id: 'warlord',
      tier: 6,
      elo: 2300,
      name: { vi: 'Đại Kiện Tướng', en: 'Grandmaster' },
      title: { vi: 'Cấp độ 6 // Đại kiện tướng', en: 'Level 6 // Grandmaster' },
      desc: {
        vi: 'Kết hợp nhuần nhuyễn giữa chiến lược dài hạn và tính toán chiến thuật chính xác. Trừng phạt ngay cả những nước đi hơi thụ động.',
        en: 'Blends long-term positional planning with sharp tactical precision. Punishes even subtle inaccuracies.'
      },
      uci: { skill: 18, limitStrength: false, elo: 2300, depth: 16, movetime: 950, multiPV: 1 },
      randomness: 0.01,
      thinkDelay: [450, 950]
    },
    {
      id: 'supreme',
      tier: 7,
      elo: 2850,
      name: { vi: 'Siêu Đại Kiện Tướng', en: 'Maximum Engine' },
      title: { vi: 'Cấp độ 7 // Sức mạnh tối đa', en: 'Level 7 // Maximum Strength' },
      desc: {
        vi: 'Tính toán ở độ sâu tối đa không giới hạn sức mạnh. Luôn tìm ra nước đi tối ưu trong cả thế trận phức tạp lẫn cờ tàn kỹ thuật.',
        en: 'Unrestricted engine calculation at maximum depth. Consistently finds optimal moves in complex tactics and technical endgames.'
      },
      uci: { skill: 20, limitStrength: false, elo: 2850, depth: 18, movetime: 1150, multiPV: 1 },
      randomness: 0,
      thinkDelay: [480, 1000]
    }
  ];

  /* ------------------------------------------------------------------
     Standard chess dialogues per tier & trigger (no sci-fi/game lore)
     ------------------------------------------------------------------ */
  const dialogues = {
    cadet: {
      greet: {
        vi: ['Chào {name}! Chúc bạn một ván cờ vui vẻ.', 'Mình mới tập chơi, cùng giao lưu một ván nhé!'],
        en: ['Hello {name}! Wishing you a fun game.', 'I am still learning the basics — let us have a good match!']
      },
      playerGoodMove: {
        vi: ['Nước đi hay quá! Mình không kịp nhìn ra.', 'Bạn phối hợp quân khéo thật đấy!'],
        en: ['Nice move! I did not see that coming.', 'Great coordination on that move!']
      },
      playerBlunder: {
        vi: ['Hình như nước vừa rồi hơi mạo hiểm thì phải?', 'Ôi, bạn vừa để hở một quân cờ kìa!'],
        en: ['Was that last move a bit risky?', 'Oh, it looks like a piece was left undefended!']
      },
      botCapture: {
        vi: ['Mình ăn quân này nhé!', 'Hay quá, mình bắt được một quân rồi.'],
        en: ['I will capture this piece!', 'Nice, I managed to win a piece.']
      },
      botCheck: {
        vi: ['Chiếu tướng! Cẩn thận nhé.', 'Vua của bạn đang bị chiếu kìa!'],
        en: ['Check! Watch out for your King.', 'Your King is in check!']
      },
      botWinning: {
        vi: ['Hình như mình đang có chút ưu thế!', 'Thế cờ này trông có lợi cho mình nhỉ.'],
        en: ['I think I might be slightly ahead here!', 'This position looks promising for me.']
      },
      botLosing: {
        vi: ['Bạn tấn công mạnh quá, mình phải cố thủ thôi!', 'Thế cờ khó thật, nhưng mình sẽ cố gắng hết sức.'],
        en: ['Your attack is really strong — I need to defend carefully!', 'Tough position, but I will keep trying.']
      },
      win: {
        vi: ['Cảm ơn bạn vì ván đấu! Chơi lại ván nữa nhé?', 'Mình thắng rồi! Một ván cờ rất thú vị.'],
        en: ['Thanks for the game! Want a rematch?', 'I won! That was a really fun game.']
      },
      lose: {
        vi: ['Bạn chơi hay lắm! Mình học thêm được nhiều điều.', 'Chúc mừng chiến thắng của bạn nhé!'],
        en: ['Well played! I learned a lot from this game.', 'Congratulations on the win!']
      },
      draw: {
        vi: ['Hòa cờ rồi! Một ván đấu rất cân sức.', 'Bất phân thắng bại! Cảm ơn bạn nhé.'],
        en: ['It is a draw! Very evenly matched.', 'A fair draw! Thanks for the game.']
      },
      thinking: {
        vi: ['Để mình suy nghĩ nước tiếp theo một chút...', 'Đi quân nào bây giờ nhỉ...'],
        en: ['Let me think about my next move...', 'Hmm, which piece should I develop...']
      },
      takeback: {
        vi: ['Bạn cứ đi lại thoải mái nhé!', 'Ok, thử một phương án khác xem sao.'],
        en: ['Feel free to take the move back!', 'Sure, try another continuation.']
      }
    },

    scout: {
      greet: {
        vi: ['Chào {name}! Hãy bắt đầu bằng một khai cuộc chắc chắn nhé.', 'Sẵn sàng rồi, chúc bạn một ván đấu tốt!'],
        en: ['Hi {name}! Let us start with a solid opening.', 'Ready when you are — have a good game!']
      },
      playerGoodMove: {
        vi: ['Một nước đi rất chính xác!', 'Đòn tấn công sắc bén đấy.'],
        en: ['A very accurate move!', 'That was a sharp tactical idea.']
      },
      playerBlunder: {
        vi: ['Nước đi đó tạo ra điểm yếu trong đội hình của bạn.', 'Cẩn thận, bạn vừa bỏ lỡ một đòn phòng thủ quan trọng.'],
        en: ['That move leaves a weakness in your position.', 'Careful — that allows a strong tactical reply.']
      },
      botCapture: {
        vi: ['Mình đổi quân để cải thiện thế cờ.', 'Thu thêm một quân có lợi cho cờ tàn.'],
        en: ['Trading material to simplify the position.', 'Winning material for the endgame.']
      },
      botCheck: {
        vi: ['Chiếu Vua!', 'Một nước chiếu để giành nhịp phát triển.'],
        en: ['Check!', 'A check to gain a tempo.']
      },
      botWinning: {
        vi: ['Các quân của mình đang phối hợp khá tốt.', 'Mình đang nắm ưu thế về vật chất.'],
        en: ['My pieces are coordinating well now.', 'I have a comfortable material edge.']
      },
      botLosing: {
        vi: ['Bạn đang gây sức ép rất lớn lên cánh Vua.', 'Mình phải tìm cách củng cố lại hàng phòng ngự.'],
        en: ['You are putting heavy pressure on my position.', 'I need to consolidate my defense here.']
      },
      win: {
        vi: ['Một ván cờ hay! Cảm ơn bạn đã thi đấu.', 'Chiến thắng thuộc về bên tận dụng cơ hội tốt hơn.'],
        en: ['Good game! Thanks for playing.', 'A clean conversion in the end.']
      },
      lose: {
        vi: ['Bạn đánh rất chắc tay. Chúc mừng nhé!', 'Mình đã mắc sai lầm ở trung cuộc. Bạn thắng xứng đáng!'],
        en: ['Very solid play from you. Congratulations!', 'I slipped up in the middlegame. Well deserved!']
      },
      draw: {
        vi: ['Hòa cờ! Cả hai bên đều phòng thủ tốt.', 'Một kết quả hòa hợp lý.'],
        en: ['Draw! Both sides defended well.', 'A fair draw after a balanced game.']
      },
      thinking: {
        vi: ['Đang cân nhắc giữa hai phương án phát triển quân...', 'Để xem nước nào kiểm soát trung tâm tốt hơn...'],
        en: ['Weighing two candidate developing moves...', 'Checking which move controls the center better...']
      },
      takeback: {
        vi: ['Đã lùi lại một nước cho bạn.', 'Hãy thử tìm nước đi tốt hơn ở hình cờ này.'],
        en: ['Stepped back one move for you.', 'See if you can find a stronger move here.']
      }
    },

    tactician: {
      greet: {
        vi: ['Chào {name}. Hãy chú ý các đòn chiến thuật ở trung tâm nhé!', 'Chúc một ván đấu giàu tính chiến thuật.'],
        en: ['Hello {name}. Keep an eye out for central tactics!', 'Wishing you a sharp tactical game.']
      },
      playerGoodMove: {
        vi: ['Nước đi tính toán rất kỹ. Bạn hóa giải hết các mối đe dọa rồi.', 'Tuyệt vời, một nước đi giàu tính chủ động.'],
        en: ['Well calculated. You neutralized all the threats.', 'Excellent — a very proactive move.']
      },
      playerBlunder: {
        vi: ['Sai lầm chiến thuật! Hình cờ này có đòn phối hợp ngay.', 'Bạn vừa để lộ sơ hở trên đường chéo và cột mở.'],
        en: ['Tactical mistake! There is a direct combination here.', 'That leaves a critical tactical vulnerability.']
      },
      botCapture: {
        vi: ['Khai thác quân không được bảo vệ đủ.', 'Bắt quân để mở rộng ưu thế chiến thuật.'],
        en: ['Capitalizing on an under-defended piece.', 'Winning material to press the initiative.']
      },
      botCheck: {
        vi: ['Chiếu! Buộc Vua phải di chuyển.', 'Đòn chiếu trực diện vào vị trí Vua.'],
        en: ['Check! Forcing the King to respond.', 'Direct check against the King.']
      },
      botWinning: {
        vi: ['Thế chủ động và không gian đều đang nghiêng về phía mình.', 'Ưu thế này đủ để chuyển hóa thành chiến thắng.'],
        en: ['Both space and initiative are on my side.', 'This advantage should be decisive with accurate play.']
      },
      botLosing: {
        vi: ['Đòn phối hợp của bạn sắc quá, mình phải tìm nước phản công.', 'Thế trận khó khăn, nhưng vẫn còn cơ hội thực chiến.'],
        en: ['Your combination was sharp — looking for counterplay.', 'Difficult position, but practical chances remain.']
      },
      win: {
        vi: ['Ván đấu kết thúc. Bạn có thể bật phân tích để xem lại các bước ngoặt.', 'Cảm ơn vì ván cờ! Các đòn chiến thuật ở trung cuộc rất thú vị.'],
        en: ['Game over. You can review the key turning points in the analysis panel.', 'Good game! The middlegame tactics were very interesting.']
      },
      lose: {
        vi: ['Khả năng nhìn đòn chiến thuật của bạn rất ấn tượng!', 'Bạn hoàn toàn làm chủ cuộc chơi. Xin chúc mừng!'],
        en: ['Your tactical vision was impressive this game!', 'You controlled the game from start to finish. Well played!']
      },
      draw: {
        vi: ['Hòa cờ sau một loạt pha đôi công hấp dẫn.', 'Cán cân chiến thuật được giữ vững tới phút cuối.'],
        en: ['A draw after an exciting tactical battle.', 'The balance held all the way to the endgame.']
      },
      thinking: {
        vi: ['Đang tính toán các biến bắt quân cưỡng bức...', 'Kiểm tra các đòn chiếu, bắt quân và đe dọa...'],
        en: ['Calculating forcing captures and checks...', 'Checking candidate tactical sequences...']
      },
      takeback: {
        vi: ['Đã hoàn tác nước đi. Quan sát kỹ các quân đang bị tấn công nhé.', 'Đi lại nhé — hãy kiểm tra các đòn chĩa đôi và ghim quân.'],
        en: ['Move taken back. Check all undefended pieces carefully.', 'Stepped back — watch out for forks and pins.']
      }
    },

    veteran: {
      greet: {
        vi: ['Chào {name}. Một thế trận chặt chẽ từ khai cuộc sẽ quyết định ván đấu.', 'Sẵn sàng. Hãy xem ai kiểm soát trung tâm và các cột mở tốt hơn.'],
        en: ['Hello {name}. A solid opening structure will set the tone.', 'Ready. Let us see who controls the center and open files better.']
      },
      playerGoodMove: {
        vi: ['Nước đi chuẩn mực, vừa củng cố thế trận vừa tạo sức ép.', 'Rất chính xác. Bạn chọn đúng kế hoạch ở hình cờ này.'],
        en: ['A textbook move — improving piece activity while creating pressure.', 'Very accurate. You found the right plan for this structure.']
      },
      playerBlunder: {
        vi: ['Nước đi hơi vội vàng và làm suy yếu cấu trúc phòng thủ.', 'Một sai lầm đáng tiếc khiến thế cờ mất cân bằng.'],
        en: ['A hasty move that weakens your defensive structure.', 'An unfortunate oversight that tips the balance.']
      },
      botCapture: {
        vi: ['Loại bỏ một quân phòng thủ quan trọng.', 'Thu lợi thế vật chất để đưa về cờ tàn.'],
        en: ['Eliminating a key defender.', 'Securing a material advantage for the endgame.']
      },
      botCheck: {
        vi: ['Chiếu! Khai thác vị trí Vua chưa an toàn.', 'Chiếu Vua để giành nhịp xâm nhập.'],
        en: ['Check! Exploiting the exposed King.', 'Checking to gain a critical tempo.']
      },
      botWinning: {
        vi: ['Cấu trúc tốt và độ tích cực của quân đang hoàn toàn có lợi cho mình.', 'Mình sẽ đơn giản hóa thế cờ để chuyển hóa ưu thế.'],
        en: ['Pawn structure and piece activity clearly favor my side.', 'Time to simplify and convert the advantage.']
      },
      botLosing: {
        vi: ['Bạn duy trì sức ép rất tốt. Mình cần phòng thủ kiên cường.', 'Ưu thế nghiêng về bạn, nhưng cờ tàn vẫn cần sự chính xác.'],
        en: ['You are keeping up great pressure. I must defend stubbornly.', 'You hold the advantage, though accuracy is still required.']
      },
      win: {
        vi: ['Một ván đấu chất lượng. Hãy xem lại phân tích để rút kinh nghiệm.', 'Cảm ơn bạn vì ván đấu!'],
        en: ['A quality game. Check the post-game analysis for key improvements.', 'Thank you for the match!']
      },
      lose: {
        vi: ['Lối chơi của bạn rất chín chắn và thuyết phục. Chúc mừng!', 'Bạn tận dụng cơ hội cực kỳ hiệu quả. Ván thắng đẹp!'],
        en: ['Mature and convincing play from you. Congratulations!', 'You converted your chances cleanly. Fine victory!']
      },
      draw: {
        vi: ['Hòa cờ xứng đáng cho cả hai bên.', 'Không bên nào vượt qua được ranh giới an toàn. Hòa!'],
        en: ['A well-earned draw for both sides.', 'Neither side overstepped the mark. Draw!']
      },
      thinking: {
        vi: ['Đang đánh giá cấu trúc tốt và hướng chuyển quân...', 'Cân nhắc phương án cải thiện vị trí quân xấu nhất...'],
        en: ['Evaluating the pawn structure and piece rerouting...', 'Looking to improve the least active piece...']
      },
      takeback: {
        vi: ['Đã lùi lại. Hãy chọn phương án giữ vững cấu trúc hơn.', 'Không sao, hãy thử lại một kế hoạch chắc chắn hơn.'],
        en: ['Move retracted. Look for a more solid continuation.', 'No problem — try a sturdier positional plan.']
      }
    },

    master: {
      greet: {
        vi: ['Chào {name}. Ở cấp độ Kiện tướng, mỗi nhịp phát triển quân đều rất quý giá.', 'Chúc bạn một ván đấu đạt độ chính xác cao.'],
        en: ['Hello {name}. At Master level, every single tempo counts.', 'Wishing you a high-accuracy game.']
      },
      playerGoodMove: {
        vi: ['Nước đi đạt chuẩn Kiện tướng — tính toán rất sâu.', 'Bạn tìm ra nước duy nhất giữ vững thế chủ động.'],
        en: ['Master-class move — deeply calculated.', 'You found the key resource to maintain the initiative.']
      },
      playerBlunder: {
        vi: ['Nước đi này đánh mất thế cân bằng và trao ngay quyền chủ động.', 'Một sai số nghiêm trọng trong tính toán.'],
        en: ['That move surrenders the balance and hands over the initiative.', 'A serious calculation error in a critical position.']
      },
      botCapture: {
        vi: ['Chuyển hóa áp lực thế trận thành ưu thế vật chất.', 'Thu quân và mở toang các tuyến tấn công.'],
        en: ['Converting positional pressure into concrete material.', 'Winning material while opening attack lines.']
      },
      botCheck: {
        vi: ['Chiếu! Phối hợp các quân tấn công trực diện vào Vua.', 'Một nước chiếu cưỡng bức làm suy yếu phòng tuyến.'],
        en: ['Check! Coordinating pieces directly against the King.', 'A forcing check that dislocates the defense.']
      },
      botWinning: {
        vi: ['Ưu thế chiến lược và chiến thuật đã rõ rệt.', 'Bây giờ là lúc kỹ thuật cờ tàn lên tiếng.'],
        en: ['The strategic and tactical advantage is now decisive.', 'Now it is a matter of clean endgame technique.']
      },
      botLosing: {
        vi: ['Bạn chơi cực kỳ chuẩn xác. Mình phải tìm biến phức tạp hóa thế cờ.', 'Ưu thế lớn cho bạn — hãy xem bạn kết thúc ván cờ thế nào.'],
        en: ['You are playing with great precision. I must look for complications.', 'Clear advantage for you — let us see your technique.']
      },
      win: {
        vi: ['Cảm ơn vì ván đấu. Hãy dùng tính năng Phân tích để xem các nước quan trọng.', 'Một ván cờ giàu hàm lượng chuyên môn!'],
        en: ['Thank you for the game. Use the Review panel to inspect critical moves.', 'A rich and instructive game!']
      },
      lose: {
        vi: ['Xuất sắc! Bạn đã chơi với phong độ của một Kiện tướng thực thụ.', 'Mình hoàn toàn tâm phục khẩu phục trước ván thắng này.'],
        en: ['Outstanding! You played at true Master strength.', 'Full credit to you for a clinical victory.']
      },
      draw: {
        vi: ['Hòa cờ ở trình độ chuyên môn rất cao.', 'Cả hai bên đều phòng thủ và phản công chuẩn xác.'],
        en: ['A high-level draw.', 'Accurate defense and counterplay from both sides.']
      },
      thinking: {
        vi: ['Đang tính sâu các biến cưỡng bức và đánh giá cờ tàn...', 'Phân tích ưu nhược điểm dài hạn của cấu trúc hiện tại...'],
        en: ['Calculating forcing lines and resulting endgames...', 'Assessing the long-term imbalances of the position...']
      },
      takeback: {
        vi: ['Đã lùi lại một nước. Hãy tìm phương án tối ưu.', 'Thử lại nhé — chú ý thứ tự các nước cưỡng bức.'],
        en: ['Move taken back. Look for the optimal continuation.', 'Try again — pay close attention to move order.']
      }
    },

    warlord: {
      greet: {
        vi: ['Chào {name}. Rất hân hạnh được đối đầu trong một ván cờ cấp Đại Kiện Tướng.', 'Hãy bắt đầu — mọi chi tiết nhỏ trên bàn cờ đều có ý nghĩa.'],
        en: ['Welcome, {name}. Pleasure to play a Grandmaster-level encounter.', 'Let us begin — every subtle nuance on the board matters.']
      },
      playerGoodMove: {
        vi: ['Một nước đi sâu sắc cả về chiến lược lẫn chiến thuật.', 'Rất ấn tượng — bạn nhìn thấu ý đồ phòng thủ từ xa.'],
        en: ['A profound move both strategically and tactically.', 'Impressive prophylaxis and calculation.']
      },
      playerBlunder: {
        vi: ['Ở cấp độ này, một sơ suất nhỏ cũng đủ định đoạt ván cờ.', 'Nước đi đó để lộ điểm yếu không thể khắc phục.'],
        en: ['At this level, a single slip is enough to decide the game.', 'That move creates an irreparable tactical weakness.']
      },
      botCapture: {
        vi: ['Thu hoạch thành quả từ áp lực tích lũy.', 'Phá vỡ mắt xích phòng thủ then chốt.'],
        en: ['Reaping the rewards of accumulated pressure.', 'Breaking a key link in the defensive chain.']
      },
      botCheck: {
        vi: ['Chiếu! Buộc Vua phải bước vào vùng nguy hiểm.', 'Chiếu Vua để kết nối toàn bộ lực lượng tấn công.'],
        en: ['Check! Forcing the King onto a vulnerable square.', 'Check — bringing the full weight of the pieces into play.']
      },
      botWinning: {
        vi: ['Toàn bộ các quân của mình đã đạt hiệu suất tối đa.', 'Thế trận đã hoàn toàn nằm trong tầm kiểm soát.'],
        en: ['All of my pieces have reached maximum harmony.', 'The position is completely under control.']
      },
      botLosing: {
        vi: ['Đáng nể thật! Bạn đang tạo ra một ván đấu để đời.', 'Áp lực từ phía bạn là rất lớn. Mình phải phòng thủ tối đa.'],
        en: ['Remarkable! You are playing a masterpiece here.', 'Tremendous pressure from your side — maximum defense required.']
      },
      win: {
        vi: ['Cảm ơn bạn vì ván đấu. Hãy kiểm tra biểu đồ đánh giá để xem bước ngoặt.', 'Một ván đấu điển hình về chuyển hóa ưu thế.'],
        en: ['Thank you for the game. Check the evaluation graph for the turning point.', 'A textbook demonstration of converting an edge.']
      },
      lose: {
        vi: ['Xin ngả mũ trước chiến thắng cấp Đại Kiện Tướng của bạn, {name}!', 'Một ván cờ hoàn hảo từ khai cuộc tới cờ tàn. Chúc mừng!'],
        en: ['Hats off to a Grandmaster-worthy victory, {name}!', 'Flawless play from opening to endgame. Congratulations!']
      },
      draw: {
        vi: ['Một ván hòa chuẩn mực với độ chính xác rất cao.', 'Cân bằng tuyệt đối sau cuộc đấu trí căng thẳng.'],
        en: ['A textbook draw played with high accuracy.', 'Complete equilibrium after a tense strategic duel.']
      },
      thinking: {
        vi: ['Đang đối chiếu các biến chiến lược dài hạn...', 'Tính toán chính xác đến từng nhịp ở giai đoạn chuyển tiếp...'],
        en: ['Comparing long-range strategic continuations...', 'Calculating exact tempos in the transition phase...']
      },
      takeback: {
        vi: ['Đã lùi lại nước đi để bạn thẩm định lại hình cờ.', 'Hãy tìm nước đi giữ vững thế cân bằng chiến lược.'],
        en: ['Move taken back so you can reassess the position.', 'Find the move that preserves dynamic balance.']
      }
    },

    supreme: {
      greet: {
        vi: ['Chào {name}. Bạn đang thử sức với cấp độ tính toán tối đa (2850).', 'Sẵn sàng. Hãy kiểm tra giới hạn tính toán của bạn!'],
        en: ['Hello {name}. You are facing maximum engine strength (2850).', 'Ready. Put your calculation to the ultimate test!']
      },
      playerGoodMove: {
        vi: ['Nước đi trùng khớp với lựa chọn hàng đầu của máy tính!', 'Độ chính xác tuyệt đối ở một hình cờ phức tạp.'],
        en: ['That matches the top engine choice!', 'Absolute precision in a complex position.']
      },
      playerBlunder: {
        vi: ['Đánh giá thế cờ vừa thay đổi mạnh sau nước đi này.', 'Một nước đi mất nhiều điểm đánh giá — hãy xem gợi ý nước tối ưu.'],
        en: ['The evaluation shifted sharply after that move.', 'A costly inaccuracy — check the optimal move suggestion.']
      },
      botCapture: {
        vi: ['Thực hiện biến bắt quân tối ưu.', 'Tối đa hóa ưu thế vật chất và thế trận.'],
        en: ['Executing the optimal capture sequence.', 'Maximizing material and positional evaluation.']
      },
      botCheck: {
        vi: ['Chiếu! Nước đi cưỡng bức mạnh nhất trên bàn cờ.', 'Chiếu Vua theo đường tính toán chính xác nhất.'],
        en: ['Check! The strongest forcing move on the board.', 'Checking along the principal variation.']
      },
      botWinning: {
        vi: ['Đánh giá đã nghiêng hẳn về một phía.', 'Chuỗi nước đi thắng cưỡng bức đã được xác lập.'],
        en: ['The evaluation is now decisively in my favor.', 'A forced winning continuation is on the board.']
      },
      botLosing: {
        vi: ['Phi thường! Bạn đang dẫn điểm trước cấp độ tối đa!', 'Một màn trình diễn siêu hạng từ phía bạn.'],
        en: ['Extraordinary! You hold the advantage against maximum strength!', 'A phenomenal performance on your part.']
      },
      win: {
        vi: ['Ván đấu kết thúc. Bạn có thể mở Phân tích sau trận để xem các nước tối ưu.', 'Cảm ơn vì ván đấu!'],
        en: ['Match concluded. Open Post-Game Review to inspect the optimal lines.', 'Thank you for the game!']
      },
      lose: {
        vi: ['Không thể tin được! Bạn đã đánh bại cấp độ 2850, {name}!', 'Một chiến thắng lịch sử. Xin chúc mừng!'],
        en: ['Unbelievable! You defeated the 2850 maximum tier, {name}!', 'A historic victory. Congratulations!']
      },
      draw: {
        vi: ['Hòa cờ trước cấp độ 2850 — độ chính xác của bạn thật đáng kinh ngạc!', 'Một kết quả xuất sắc trước sức mạnh tối đa.'],
        en: ['A draw against 2850 — your accuracy was remarkable!', 'An outstanding result against maximum strength.']
      },
      thinking: {
        vi: ['Đang phân tích chuyên sâu các biến số trên bàn cờ...', 'Tìm kiếm phương án tối ưu nhất...'],
        en: ['Running deep multi-ply calculation...', 'Searching for the principal variation...']
      },
      takeback: {
        vi: ['Đã lùi lại một nước. Hãy thử tìm nước đi tốt nhất của engine.', 'Hoàn tác thành công — hãy phân tích kỹ hình cờ.'],
        en: ['Move taken back. See if you can spot the engine\'s top choice.', 'Takeback complete — examine the position closely.']
      }
    }
  };

  /* ------------------------------------------------------------------
     Clean Chess Emblem SVG Portraits per Tier (viewBox 0 0 120 120)
     Uses classical chess piece silhouettes & rank stars in the NieR beige/dark palette.
     ------------------------------------------------------------------ */
  const TIER_ICONS = {
    1: '<circle cx="60" cy="40" r="11"/><path d="M49 52 L71 52 L68 61 L52 61 Z"/><path d="M51 61 L69 61 L76 86 L44 86 Z"/><rect x="38" y="86" width="44" height="8"/>',
    2: '<path d="M40 86 L46 66 L58 56 L55 49 L42 60 L35 55 L35 46 L49 30 L49 21 L55 27 L63 21 L77 35 L82 54 L78 86 Z"/><rect x="36" y="86" width="48" height="8"/>',
    3: '<circle cx="60" cy="21" r="4.5"/><path d="M60 26 L75 43 L68 58 L52 58 L45 43 Z"/><path d="M51 58 L69 58 L76 86 L44 86 Z"/><rect x="36" y="86" width="48" height="8"/>',
    4: '<path d="M38 46 L38 26 L47 26 L47 33 L55 33 L55 26 L65 26 L65 33 L73 33 L73 26 L82 26 L82 46 Z"/><path d="M43 46 L77 46 L79 86 L41 86 Z"/><rect x="35" y="86" width="50" height="8"/>',
    5: '<path d="M41 86 L33 41 L47 64 L46 31 L56 60 L60 26 L64 60 L74 31 L73 64 L87 41 L79 86 Z"/><circle cx="33" cy="37" r="3.5"/><circle cx="46" cy="27" r="3.5"/><circle cx="60" cy="22" r="3.5"/><circle cx="74" cy="27" r="3.5"/><circle cx="87" cy="37" r="3.5"/><rect x="35" y="86" width="50" height="8"/>',
    6: '<rect x="57" y="13" width="6" height="20"/><rect x="50" y="19" width="20" height="6"/><path d="M41 86 L36 53 L60 41 L84 53 L79 86 Z"/><rect x="35" y="86" width="50" height="8"/>',
    7: '<polygon points="60,12 64,22 75,22 66,28 69,38 60,32 51,38 54,28 45,22 56,22"/><path d="M41 86 L34 45 L48 64 L60 38 L72 64 L86 45 L79 86 Z"/><rect x="34" y="86" width="52" height="8"/>'
  };

  function portrait(id, size) {
    size = size || 120;
    const bot = get(id) || list[0];
    const t = bot.tier;
    const stars = '★'.repeat(Math.min(t, 7));
    const darkBg = t >= 5 ? '#3e3a32' : '#4b4340';
    const fg = '#d3cebb';
    const accent = t === 7 ? '#850000' : (t >= 5 ? '#c9772b' : '#9e9782');

    return (
      '<svg viewBox="0 0 120 120" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + bot.name.en + '">' +
      '<rect width="120" height="120" fill="' + darkBg + '"/>' +
      '<rect x="4" y="4" width="112" height="112" fill="none" stroke="' + fg + '" stroke-width="1.5" opacity="0.75"/>' +
      '<line x1="10" y1="20" x2="110" y2="20" stroke="' + fg + '" stroke-width="0.7" opacity="0.35"/>' +
      '<text x="60" y="15" text-anchor="middle" fill="' + fg + '" font-size="9" font-family="Montserrat, sans-serif" font-weight="700" letter-spacing="1">ELO ' + bot.elo + '</text>' +
      '<g fill="' + fg + '" stroke="' + accent + '" stroke-width="1.4" transform="translate(0, 2)">' +
      (TIER_ICONS[t] || TIER_ICONS[1]) +
      '</g>' +
      '<text x="60" y="111" text-anchor="middle" fill="' + fg + '" font-size="9" font-family="sans-serif" letter-spacing="1.5">' + stars + '</text>' +
      '</svg>'
    );
  }

  function get(id) {
    return list.find(b => b.id === id) || null;
  }

  function say(id, trigger, params) {
    const d = dialogues[id] || dialogues.cadet;
    const entry = d[trigger] || d.greet;
    const lang = (window.I18N && window.I18N.lang) || 'vi';
    const arr = (entry && entry[lang]) || (entry && entry.en) || ['...'];
    const r = (params && typeof params.variant === 'number') ? params.variant : Math.random();
    const idx = Math.min(arr.length - 1, Math.floor(r * arr.length));
    let line = arr[idx] || arr[0] || '...';
    if (params) {
      line = line.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? params[k] : m));
    }
    return line;
  }

  window.Bots = {
    list,
    get,
    portrait,
    say
  };
})();
