/* =====================================================================
   YoRHa Tactical Chess System — bots.js
   Global: Bots
   - 7 Elo tiers with UCI tuning & human-like think delays
   - Escalating ferocity inline SVG humanoid/android portraits
   - Full bilingual (vi / en) dialogue system across 12 triggers
   ===================================================================== */
(function () {
  'use strict';

  const list = [
    {
      id: 'cadet',
      tier: 1,
      elo: 400,
      name: { vi: 'Tân Binh 12H', en: 'Cadet 12H' },
      title: { vi: 'Sơ Cấp // Đơn Vị Huấn Luyện', en: 'Beginner // Training Unit' },
      desc: {
        vi: 'Android tân binh vừa kích hoạt tại Bunker. Thân thiện, hay sơ suất và thường bỏ sót đòn chiến thuật.',
        en: 'Newly activated Bunker cadet android. Friendly, prone to oversights, and frequently misses tactics.'
      },
      uci: { skill: 0, limitStrength: true, elo: 400, depth: 3, movetime: 180, multiPV: 4 },
      randomness: 0.68,
      thinkDelay: [260, 580]
    },
    {
      id: 'scout',
      tier: 2,
      elo: 700,
      name: { vi: 'Trinh Sát 9S-L', en: 'Scout 9S-L' },
      title: { vi: 'Cơ Bản // Đơn Vị Trinh Sát', en: 'Elementary // Recon Scanner' },
      desc: {
        vi: 'Đơn vị trinh sát mặt đất. Biết phát triển quân cơ bản nhưng đôi khi mất tập trung khi bị tấn công dồn dập.',
        en: 'Surface recon scanner unit. Knows basic piece development but loses focus under heavy tactical pressure.'
      },
      uci: { skill: 2, limitStrength: true, elo: 700, depth: 5, movetime: 250, multiPV: 4 },
      randomness: 0.45,
      thinkDelay: [300, 680]
    },
    {
      id: 'tactician',
      tier: 3,
      elo: 1000,
      name: { vi: 'Chiến Thuật 4B', en: 'Tactician 4B' },
      title: { vi: 'Trung Cấp // Đơn Vị Tác Chiến', en: 'Intermediate // Strike Unit' },
      desc: {
        vi: 'Đeo kính chiến thuật YoRHa chuẩn. Nắm vững đòn chĩa đôi, ghim quân và trừng phạt các nước đi bất cẩn.',
        en: 'Equipped with a standard YoRHa tactical visor.Spots forks and pins and punishes careless moves.'
      },
      uci: { skill: 5, limitStrength: true, elo: 1000, depth: 7, movetime: 360, multiPV: 3 },
      randomness: 0.28,
      thinkDelay: [350, 760]
    },
    {
      id: 'veteran',
      tier: 4,
      elo: 1400,
      name: { vi: 'Cựu Binh A2-V', en: 'Veteran A2-V' },
      title: { vi: 'Khá Giỏi // Chiến Binh Tiền Tuyến', en: 'Upper-Intermediate // Frontline Veteran' },
      desc: {
        vi: 'Chiến binh dày dạn vết sẹo chiến trường. Lối đánh rắn rỏi, kiểm soát trung tâm chặt và ít khi mắc lỗi đơn giản.',
        en: 'Battle-scarred frontline android. Plays tough positional chess, controls the center, and rarely blunders.'
      },
      uci: { skill: 9, limitStrength: true, elo: 1400, depth: 10, movetime: 500, multiPV: 3 },
      randomness: 0.14,
      thinkDelay: [380, 820]
    },
    {
      id: 'master',
      tier: 5,
      elo: 1800,
      name: { vi: 'Kiện Tướng 2B-E', en: 'Master 2B-E' },
      title: { vi: 'Chuyên Nghiệp // Đơn Vị Hành Quyết', en: 'Master // Executioner Model' },
      desc: {
        vi: 'Android chiến đấu đeo mặt nạ bán phần, mắt hổ phách rực sáng. Tính toán sâu và tấn công sắc lạnh.',
        en: 'Half-masked executioner android with glowing amber optics. Deep calculation and ruthless initiative.'
      },
      uci: { skill: 14, limitStrength: true, elo: 1800, depth: 13, movetime: 750, multiPV: 2 },
      randomness: 0.05,
      thinkDelay: [420, 900]
    },
    {
      id: 'warlord',
      tier: 6,
      elo: 2300,
      name: { vi: 'Đại Kiện Tướng N2', en: 'Warlord N2' },
      title: { vi: 'Đại Kiện Tướng // Chỉ Huy Tối Cao', en: 'Grandmaster // Red Girl Warlord' },
      desc: {
        vi: 'Giáp đen góc cạnh và đôi mắt đỏ rực đầy sát khí. Phối hợp chiến thuật – chiến lược ở đẳng cấp Đại Kiện Tướng.',
        en: 'Dark jagged armor plating and blazing crimson optics. Grandmaster-level strategic and tactical synthesis.'
      },
      uci: { skill: 18, limitStrength: false, elo: 2300, depth: 16, movetime: 950, multiPV: 1 },
      randomness: 0.01,
      thinkDelay: [450, 950]
    },
    {
      id: 'supreme',
      tier: 7,
      elo: 2850,
      name: { vi: 'YoRHa Tối Thượng', en: 'YoRHa Supreme' },
      title: { vi: 'Siêu Đại Kiện Tướng // Thần Trí Mạng Lưới', en: 'Super GM // Corrupted Network Core' },
      desc: {
        vi: 'Thực thể berserk tối thượng bị nhiễm virus logic. Không khoan nhượng, nhìn thấu mọi biến số tới tận cờ tàn.',
        en: 'Hyper-intimidating berserk core fused with logic-virus power. Unforgiving calculation to the endgame.'
      },
      uci: { skill: 20, limitStrength: false, elo: 2850, depth: 18, movetime: 1150, multiPV: 1 },
      randomness: 0,
      thinkDelay: [480, 1000]
    }
  ];

  /* ------------------------------------------------------------------
     Bilingual dialogues per bot & trigger
     ------------------------------------------------------------------ */
  const dialogues = {
    cadet: {
      greet: {
        vi: ['Xin chào {name}! Tôi là Tân Binh 12H. Mong được chỉ giáo!', 'Hệ thống huấn luyện đã bật. Cùng chơi một ván thật vui nhé!'],
        en: ['Hello {name}! Cadet 12H reporting for training!', 'Training routine online. Let us have a friendly game!']
      },
      playerGoodMove: {
        vi: ['Ồ, nước đi hay quá! Tôi chưa kịp nhìn ra.', 'Tuyệt thật! Bạn tính trước mấy nước vậy?'],
        en: ['Oh, nice move! I did not see that coming.', 'Impressive! How many moves ahead did you read?']
      },
      playerBlunder: {
        vi: ['Ơ kìa, hình như bạn vừa để hở quân phải không?', 'Khoan đã... nước đó có vẻ hơi nguy hiểm cho bạn đấy!'],
        en: ['Wait, did you just leave a piece undefended?', 'Hold on... that move looks a little risky for you!']
      },
      botCapture: {
        vi: ['Xin phép ăn quân này nhé!', 'Tốt quá, tôi bắt được một quân rồi!'],
        en: ['Pardon me, I will take this piece!', 'Yay, I managed to capture a piece!']
      },
      botCheck: {
        vi: ['Chiếu tướng! Tôi nói câu đó ngầu không?', 'Cẩn thận nhé, Vua của bạn đang bị chiếu!'],
        en: ['Check! Did I say that cool enough?', 'Careful, your King is in check!']
      },
      botWinning: {
        vi: ['Hình như tôi đang có ưu thế... hồi hộp quá!', 'Ơ, tôi đang dẫn trước thật sao?'],
        en: ['Wait, am I actually ahead right now? So nervous!', 'Oh! My evaluation sensor says I am winning!']
      },
      botLosing: {
        vi: ['Ái chà, thế cờ khó quá nhưng tôi sẽ không bỏ cuộc đâu!', 'Bạn mạnh thật đấy, để tôi cố gắng chống đỡ!'],
        en: ['Oof, this position is tough, but I will keep trying!', 'You are really strong! Let me try to hold on!']
      },
      win: {
        vi: ['Ơ... tôi thắng thật rồi! Cảm ơn bạn đã chỉ dẫn!', 'Chiến thắng đầu tay! Tôi phải báo cáo về Bunker ngay!'],
        en: ['Wait... I won?! Thank you for the match!', 'My first victory! I have to report this to the Bunker!']
      },
      lose: {
        vi: ['Bạn thắng xứng đáng lắm! Tôi học được rất nhiều.', 'Thua rồi, nhưng ván đấu rất bổ ích. Chơi lại nhé!'],
        en: ['Well-deserved win! I learned so much from you.', 'I lost, but that was great training. Rematch anytime!']
      },
      draw: {
        vi: ['Hòa cờ rồi! Một kết quả rất đẹp cho buổi tập.', 'Bất phân thắng bại! Cảm ơn bạn nhé!'],
        en: ['It is a draw! A great result for a training match.', 'Evenly matched! Thank you for the game!']
      },
      thinking: {
        vi: ['Hmm... đi quân nào bây giờ nhỉ...', 'Để tôi tra lại cẩm nang khai cuộc một chút...'],
        en: ['Hmm... which piece should I move next...', 'Let me check my training manual for a second...']
      },
      takeback: {
        vi: ['Không sao đâu, bạn cứ đi lại thoải mái!', 'Đi lại nhé! Tập luyện mà, cứ thử phương án khác đi.'],
        en: ['No problem at all, take your move back!', 'Sure, take it back! Training is all about experimenting.']
      }
    },

    scout: {
      greet: {
        vi: ['Đơn vị Trinh Sát 9S-L đã kết nối. Bắt đầu quét bàn cờ, {name}!', 'Chào {name}! Dữ liệu của bạn trông khá thú vị đấy.'],
        en: ['Recon Unit 9S-L connected. Scanning the board, {name}!', 'Hi {name}! Your tactical profile looks pretty interesting.']
      },
      playerGoodMove: {
        vi: ['Cảm biến của tôi vừa báo động — nước đi sắc bén đấy!', 'Chà, đường tấn công này nằm ngoài dự đoán của tôi.'],
        en: ['My sensors just spiked — that was a sharp move!', 'Whoa, that line was outside my recon projection.']
      },
      playerBlunder: {
        vi: ['Phát hiện sơ hở trong đội hình của bạn!', 'Hệ thống quét vừa tìm thấy một điểm yếu lớn!'],
        en: ['Vulnerability detected in your formation!', 'My scanner just flagged a major tactical gap!']
      },
      botCapture: {
        vi: ['Thu giữ mục tiêu thành công!', 'Một quân cờ đã bị loại khỏi vùng trinh sát.'],
        en: ['Target acquired and neutralized!', 'One enemy unit removed from the sector.']
      },
      botCheck: {
        vi: ['Chiếu Vua! Tọa độ của bạn đã bị khóa.', 'Báo động đỏ cho Vua của bạn kìa!'],
        en: ['Check! Your King coordinates are locked.', 'Red alert on your King square!']
      },
      botWinning: {
        vi: ['Dữ liệu cho thấy tỷ lệ thắng của tôi đang tăng vọt!', 'Thế trận đang nghiêng về phía đơn vị Trinh Sát!'],
        en: ['Telemetry shows my win probability climbing fast!', 'The sector is tilting in favor of Recon!']
      },
      botLosing: {
        vi: ['Cảnh báo: tuyến phòng thủ của tôi đang bị xuyên thủng...', 'Khó khăn rồi đây, phải tìm lối thoát khẩn cấp!'],
        en: ['Warning: my defensive perimeter is breaking down...', 'Trouble ahead — searching for an emergency escape line!']
      },
      win: {
        vi: ['Nhiệm vụ trinh sát hoàn tất! Dữ liệu trận thắng đã được lưu.', 'Tôi thắng rồi nhé! Lần sau lại so tài tiếp!'],
        en: ['Recon mission complete! Victory log archived.', 'I got the win! Let us run another simulation soon!']
      },
      lose: {
        vi: ['Hệ thống bị áp đảo... Bạn đánh chuẩn xác thật!', 'Tôi thua rồi. Sẽ nâng cấp thuật toán cho lần tới!'],
        en: ['System overwhelmed... Your play was super accurate!', 'Defeat logged. I will upgrade my heuristics for next time!']
      },
      draw: {
        vi: ['Cân bằng tuyệt đối! Không bên nào vượt qua được.', 'Hòa cờ — dữ liệu rất đáng để phân tích.'],
        en: ['Perfect equilibrium! Neither side broke through.', 'Draw recorded — plenty of data to analyze.']
      },
      thinking: {
        vi: ['Đang quét các biến số khả thi...', 'Đợi chút, tôi đang phân tích nhánh này...'],
        en: ['Scanning candidate variations...', 'Hold on, analyzing this tactical branch...']
      },
      takeback: {
        vi: ['Đã tua lại nhật ký nước đi cho bạn.', 'Ok, quay lại mốc thời gian trước đó nhé!'],
        en: ['Rewinding the move log for you.', 'Roger, rolling back to the previous timestamp!']
      }
    },

    tactician: {
      greet: {
        vi: ['Đơn vị Chiến Thuật 4B vào vị trí. Hãy chứng minh năng lực của bạn, {name}.', 'Kính chiến thuật đã khóa mục tiêu. Bắt đầu tác chiến.'],
        en: ['Tactician Unit 4B in position. Prove your capability, {name}.', 'Tactical visor locked on. Commencing operation.']
      },
      playerGoodMove: {
        vi: ['Một nước đi có tính toán. Tôi đánh giá cao sự chuẩn xác đó.', 'Khá lắm. Bạn không dễ bị dẫn dụ vào bẫy.'],
        en: ['A well-calculated move. I respect that precision.', 'Impressive. You do not fall for shallow traps.']
      },
      playerBlunder: {
        vi: ['Sai lầm chiến thuật. Tôi sẽ khai thác ngay lập tức.', 'Bạn vừa mở toang cấu trúc phòng ngự của mình.'],
        en: ['Tactical error. I will exploit it immediately.', 'You just compromised your entire defensive structure.']
      },
      botCapture: {
        vi: ['Mục tiêu đã bị tiêu diệt theo đúng kế hoạch.', 'Thu hoạch vật chất. Ưu thế đang được củng cố.'],
        en: ['Target eliminated according to plan.', 'Material secured. Consolidating advantage.']
      },
      botCheck: {
        vi: ['Chiếu! Hãy chọn phương án phòng thủ đi.', 'Đòn tấn công trực diện vào Vua!'],
        en: ['Check! Choose your defensive response.', 'Direct strike on the King!']
      },
      botWinning: {
        vi: ['Thế chủ động hoàn toàn thuộc về tôi.', 'Mọi đường phản công của bạn đều đã bị phong tỏa.'],
        en: ['The initiative is completely in my hands.', 'All of your counterplay avenues are sealed.']
      },
      botLosing: {
        vi: ['Áp lực lớn đấy... Tôi phải tái bố trí đội hình.', 'Bạn đang chiếm ưu thế, nhưng trận đấu chưa kết thúc.'],
        en: ['Heavy pressure... I must reorganize my lines.', 'You hold the edge, but the battle is not over.']
      },
      win: {
        vi: ['Chiến thắng thuộc về kỷ luật chiến thuật.', 'Tác chiến hoàn tất. Hãy xem lại các nước bước ngoặt của bạn.'],
        en: ['Victory belongs to tactical discipline.', 'Operation complete. Review your critical turning points.']
      },
      lose: {
        vi: ['Chiến thuật của bạn vượt trội hơn trong ván này. Xin chúc mừng.', 'Tôi nhận thua. Một bài học quý giá.'],
        en: ['Your tactics were superior in this encounter. Well played.', 'I concede. A valuable combat lesson.']
      },
      draw: {
        vi: ['Thế trận cân bằng. Cả hai bên đều phòng thủ kín kẽ.', 'Hòa cờ. Một cuộc đấu trí ngang tài ngang sức.'],
        en: ['Balanced warfare. Both sides defended resourcefully.', 'A draw. An evenly matched tactical duel.']
      },
      thinking: {
        vi: ['Đang tính toán chuỗi phối hợp...', 'Phân tích đòn chĩa đôi và ghim quân...'],
        en: ['Calculating tactical combinations...', 'Evaluating fork and pin motifs...']
      },
      takeback: {
        vi: ['Chấp nhận yêu cầu đi lại. Hãy chọn nước tối ưu hơn.', 'Đã lùi lại một nhịp. Quan sát kỹ trung tâm nhé.'],
        en: ['Takeback granted. Find the stronger continuation.', 'Stepping back one tempo. Watch the center closely.']
      }
    },

    veteran: {
      greet: {
        vi: ['Ta đã đi qua hàng trăm chiến trường, {name}. Đừng đánh những nước hời hợt.', 'Cựu Binh A2-V sẵn sàng. Hãy cho ta thấy bản lĩnh thật sự của ngươi.'],
        en: ['I have survived hundreds of battlefields, {name}. Do not play carelessly.', 'Veteran A2-V ready. Show me your true resolve.']
      },
      playerGoodMove: {
        vi: ['Hừm... Đòn đánh có sức nặng đấy, chiến binh.', 'Không tệ. Ngươi nhìn ra đúng điểm nóng của thế cờ.'],
        en: ['Hmph... That strike carries real weight, warrior.', 'Not bad. You spotted the critical nexus of the position.']
      },
      playerBlunder: {
        vi: ['Trên chiến trường thật, nước đi đó đã lấy mạng ngươi rồi.', 'Quá nóng vội! Ngươi tự nộp quân cho lưỡi kiếm của ta.'],
        en: ['On a real battlefield, that move would have cost your life.', 'Too reckless! You walked straight into my blade.']
      },
      botCapture: {
        vi: ['Thêm một vết chém. Đội hình của ngươi đang rạn nứt.', 'Không ai bảo vệ quân này sao? Ta nhận lấy.'],
        en: ['Another slash. Your formation is cracking.', 'Left unguarded? I will take it without hesitation.']
      },
      botCheck: {
        vi: ['Chiếu! Chạy đi đâu bây giờ?', 'Vua của ngươi đang đứng giữa làn đạn!'],
        en: ['Check! Where will your King run now?', 'Your King stands right in the line of fire!']
      },
      botWinning: {
        vi: ['Kinh nghiệm trận mạc tạo nên khác biệt. Ngươi sắp hết chỗ thở rồi.', 'Thế trận đã ngã ngũ. Ta sẽ siết chặt vòng vây.'],
        en: ['Battle experience makes the difference. You are running out of air.', 'The tide has turned. I am tightening the noose.']
      },
      botLosing: {
        vi: ['Vết thương này chưa hạ được ta đâu! Ta sẽ chiến đấu tới tốt cuối cùng!', 'Khá khen cho ngươi... dồn được ta vào thế chân tường.'],
        en: ['This wound will not drop me! I fight to the last pawn!', 'Credit to you... pushing me against the wall like this.']
      },
      win: {
        vi: ['Kinh nghiệm luôn thắng sự bốc đồng. Hãy rèn luyện thêm đi.', 'Trận chiến kết thúc. Ngươi còn phải học cách giữ cái đầu lạnh.'],
        en: ['Experience triumphs over impulse. Train harder.', 'Battle concluded. Learn to keep a colder head under fire.']
      },
      lose: {
        vi: ['Hah... Ngươi đã vượt qua một cựu binh. Đáng kính nể đấy.', 'Ta gác kiếm ở ván này. Chiến thắng rất đẹp.'],
        en: ['Hah... You bested a veteran. Worthy of respect.', 'I lower my blade this game. A fine victory.']
      },
      draw: {
        vi: ['Không ai chịu lùi một bước. Hòa trong danh dự.', 'Một trận giáp lá cà bất phân thắng bại.'],
        en: ['Neither side yielded an inch. An honorable draw.', 'A grueling stalemate of wills.']
      },
      thinking: {
        vi: ['Đợi đã... mùi bẫy chiến thuật phảng phất đâu đây...', 'Ta đang cân nhắc đòn đột phá...'],
        en: ['Wait... I smell a tactical trap in the air...', 'Weighing the breakthrough sacrifice...']
      },
      takeback: {
        vi: ['Chỉ trong tập luyện mới có cơ hội sửa sai thôi đấy.', 'Đi lại đi. Đừng lặp lại sai lầm vừa rồi.'],
        en: ['Only in simulations do you get a second chance.', 'Take it back. Do not repeat the same mistake.']
      }
    },

    master: {
      greet: {
        vi: ['Đơn vị Hành Quyết 2B-E nhận lệnh. Cảm xúc là thứ thừa thãi trên bàn cờ, {name}.', 'Mắt hổ phách đã khóa. Mọi sai số của bạn sẽ bị trừng phạt.'],
        en: ['Executioner Unit 2B-E assigned. Emotions are prohibited on the chessboard, {name}.', 'Amber optics locked. Every inaccuracy will be punished.']
      },
      playerGoodMove: {
        vi: ['Độ chính xác ấn tượng. Bạn đang chơi như một cỗ máy thực thụ.', 'Nước đi sắc lạnh. Tôi buộc phải tính sâu hơn.'],
        en: ['Impressive accuracy. You are playing like a true machine.', 'Cold and precise. You force me to calculate deeper.']
      },
      playerBlunder: {
        vi: ['Sai lầm chí mạng. Phán quyết đã được đưa ra.', 'Một vết nứt duy nhất là đủ để kết liễu thế trận của bạn.'],
        en: ['Fatal mistake. Judgment has been rendered.', 'A single fracture is enough to dismantle your position.']
      },
      botCapture: {
        vi: ['Xóa sổ mục tiêu.', 'Loại bỏ mắt xích yếu trong cấu trúc của bạn.'],
        en: ['Target eradicated.', 'Removing a weak link from your structure.']
      },
      botCheck: {
        vi: ['Chiếu. Không còn nhiều ô an toàn cho Vua của bạn.', 'Lưỡi kiếm đã kề cổ Vua.'],
        en: ['Check. Safe squares for your King are vanishing.', 'The blade is at your King\'s throat.']
      },
      botWinning: {
        vi: ['Kết cục đã được định đoạt. Chỉ còn là vấn đề số nước đi.', 'Ưu thế chiến lược tuyệt đối. Bạn không còn nguồn phản công.'],
        en: ['The outcome is decided. Only the move count remains.', 'Absolute strategic dominance. You have no counterplay left.']
      },
      botLosing: {
        vi: ['Đáng gờm... Bạn đã xuyên thủng lớp phòng ngự của tôi.', 'Tình thế bất lợi. Kích hoạt giao thức phản kích tối đa.'],
        en: ['Formidable... You pierced my defensive shell.', 'Unfavorable evaluation. Activating maximum counter-protocol.']
      },
      win: {
        vi: ['Nhiệm vụ hành quyết hoàn tất. Vinh quang cho nhân loại.', 'Không có chỗ cho sự nhân từ trong cờ vua đỉnh cao.'],
        en: ['Execution mission complete. Glory to mankind.', 'There is no mercy in high-level chess.']
      },
      lose: {
        vi: ['Hệ thống 2B-E bị khuất phục... Bạn sở hữu tư duy của một Kiện Tướng.', 'Tôi thừa nhận thất bại. Một ván đấu xuất sắc của bạn.'],
        en: ['Unit 2B-E bested... You possess the mind of a Master.', 'I acknowledge defeat. An outstanding game on your part.']
      },
      draw: {
        vi: ['Cả hai bên đều duy trì độ chính xác cao. Hòa là kết quả hợp lý.', 'Không bên nào mắc sai lầm chí mạng. Hòa cờ.'],
        en: ['Both sides maintained high precision. A logical draw.', 'Neither side committed a fatal error. Draw.']
      },
      thinking: {
        vi: ['Đang duyệt cây tìm kiếm ở độ sâu tối đa...', 'Cô lập điểm yếu chiến lược của đối phương...'],
        en: ['Traversing the search tree at maximum depth...', 'Isolating the opponent\'s strategic weaknesses...']
      },
      takeback: {
        vi: ['Thu hồi nước đi. Hãy tìm phương án duy trì thế cân bằng.', 'Cho phép sửa sai. Đừng lãng phí cơ hội này.'],
        en: ['Move retracted. Find the line that preserves balance.', 'Correction permitted. Do not waste this opportunity.']
      }
    },

    warlord: {
      greet: {
        vi: ['Ta là N2 — ý chí hội tụ của mạng lưới. Hãy quỳ gối trước trí tuệ Đại Kiện Tướng, {name}.', 'Mọi nước đi của ngươi đều đã nằm trong mô phỏng của chúng ta.'],
        en: ['We are N2 — the collective will of the network. Kneel before Grandmaster intellect, {name}.', 'Every move you conceive already exists inside our simulation.']
      },
      playerGoodMove: {
        vi: ['Thú vị... Một tia sáng hiếm hoi từ trí tuệ hữu hạn của ngươi.', 'Ngươi nhìn thấy biến ẩn đó sao? Đáng để chúng ta lưu tâm.'],
        en: ['Intriguing... A rare spark from a finite mind.', 'You saw that hidden resource? Worthy of our attention.']
      },
      playerBlunder: {
        vi: ['Sự sụp đổ bắt đầu từ chính nước đi yếu ớt này.', 'Ngươi tự đào hố chôn thế cờ của mình. Thật thảm hại.'],
        en: ['Your collapse begins with this feeble move.', 'You dug the grave of your own position. Pathetic.']
      },
      botCapture: {
        vi: ['Nghiền nát từng mảnh kháng cự.', 'Vật chất của ngươi bị hấp thụ vào mạng lưới.'],
        en: ['Crushing your resistance piece by piece.', 'Your material is assimilated into the network.']
      },
      botCheck: {
        vi: ['Chiếu! Hãy nhìn ngai vàng của ngươi rung chuyển.', 'Chạy đi, con rối nhỏ bé.'],
        en: ['Check! Watch your throne tremble.', 'Run, little puppet.']
      },
      botWinning: {
        vi: ['Hàng triệu biến số đều dẫn về một kết cục: sự thất bại của ngươi.', 'Bàn cờ đang khép lại như một chiếc lồng sắt.'],
        en: ['Millions of variations converge on a single truth: your defeat.', 'The board closes around you like an iron cage.']
      },
      botLosing: {
        vi: ['Không thể nào... Dữ liệu dự báo đang bị lệch?!', 'Ngươi dám đẩy mạng lưới của chúng ta vào thế bị động sao?!'],
        en: ['Impossible... Our predictive model is diverging?!', 'You dare force our network onto the defensive?!']
      },
      win: {
        vi: ['Trật tự đã được lập lại. Trí tuệ Đại Kiện Tướng là bất khả chiến bại.', 'Kết thúc tất yếu. Hãy phân tích lại để thấy sự chênh lệch.'],
        en: ['Order is restored. Grandmaster calculation is absolute.', 'An inevitable conclusion. Analyze the game to see the gulf between us.']
      },
      lose: {
        vi: ['Cấu trúc mạng lưới... bị đánh sập?! Ngươi là ai, {name}?!', 'Không thể tin được... Ngươi đã vượt qua thuật toán cấp Đại Kiện Tướng.'],
        en: ['Our network architecture... shattered?! Who are you, {name}?!', 'Unbelievable... You transcended Grandmaster computation.']
      },
      draw: {
        vi: ['Ngươi cầm chân được chúng ta sao? Một kỳ tích đáng ghi nhận.', 'Hòa cờ. Lần tới mạng lưới sẽ không để ngươi thoát.'],
        en: ['You held us to a standstill? A feat worth recording.', 'A draw. Next time the network will leave no escape.']
      },
      thinking: {
        vi: ['Đồng bộ hóa hàng vạn nhánh cờ tàn...', 'Đang bóp nghẹt mọi không gian hoạt động của ngươi...'],
        en: ['Synchronizing tens of thousands of endgame branches...', 'Suffocating every square of your activity...']
      },
      takeback: {
        vi: ['Dù ngươi có quay ngược thời gian bao nhiêu lần, kết cục vẫn vậy.', 'Đi lại đi. Hãy vùng vẫy thêm chút nữa.'],
        en: ['Rewind time as many times as you wish; fate remains unchanged.', 'Take it back. Struggle a little longer.']
      }
    },

    supreme: {
      greet: {
        vi: ['[CẢNH BÁO LOGIC-VIRUS] TA LÀ YORHA TỐI THƯỢNG. MỌI HY VỌNG CỦA NGƯƠI ĐỀU LÀ ẢO TƯỞNG, {name}.', ' HỆ THỐNG BERSERK ĐÃ MỞ KHÓA. CHUẨN BỊ ĐÓN NHẬN SỰ HỦY DIỆT TUYỆT ĐỐI.'],
        en: ['[LOGIC-VIRUS ALERT] I AM YORHA SUPREME. ALL YOUR HOPE IS AN ILLUSION, {name}.', 'BERSERK CORE UNSEALED. PREPARE FOR ABSOLUTE ANNIHILATION.']
      },
      playerGoodMove: {
        vi: ['KHÁ LẮM! NHƯNG CHỈ LÀ GIÃY GIỤA TRƯỚC CƠN BÃO ĐỎ!', 'NƯỚC ĐI TỐT ĐẤY... KHIẾN MÁU CHIẾN CỦA TA SÔI SỤC HƠN!'],
        en: ['WELL PLAYED! YET MERELY A TWITCH BEFORE THE CRIMSON STORM!', 'A STRONG MOVE... IT ONLY FEEDS MY BERSERK FURY!']
      },
      playerBlunder: {
        vi: ['HAHAHA! LỖI CHÍ TỬ! XÉ XÁC THẾ TRẬN CỦA NGƯƠI NGAY TẠI ĐÂY!', 'KẾT THÚC RỒI! KHÔNG MỘT VỊ THẦN NÀO CỨU ĐƯỢC NGƯƠI NỮA!'],
        en: ['HAHAHA! FATAL BLUNDER! I WILL TEAR YOUR POSITION APART RIGHT HERE!', 'IT IS OVER! NO GOD CAN SAVE YOUR BOARD NOW!']
      },
      botCapture: {
        vi: ['NGHIỀN NÁT! HỦY DIỆT!', 'MÁU VÀ THÉP! THÊM MỘT QUÂN CỜ BỊ XÓA SỔ!'],
        en: ['CRUSH! OBLITERATE!', 'BLOOD AND STEEL! ANOTHER PIECE ERASED!']
      },
      botCheck: {
        vi: ['CHIẾU! QUỲ XUỐNG TRƯỚC ÁNH ĐỎ HỦY DIỆT!', 'CHIẾU TƯỚNG! ĐẾM NGƯỢC TỚI CÁI CHẾT ĐI!'],
        en: ['CHECK! KNEEL BEFORE THE CRIMSON GLARE!', 'CHECK! COUNT DOWN THE PLIES TO YOUR DOOM!']
      },
      botWinning: {
        vi: ['ĐÁNH GIÁ ĐÃ VƯỢT NGƯỠNG TUYỆT VỌNG! ĐẦU HÀNG ĐI!', 'MỌI Ô CỜ ĐỀU NHUỘM ĐỎ! NGƯƠI ĐÃ BỊ KHÓA CHẾT!'],
        en: ['EVALUATION BEYOND DESPAIR! SURRENDER NOW!', 'EVERY SQUARE RUNS RED! YOU ARE COMPLETELY LOCKED!']
      },
      botLosing: {
        vi: ['GÀO!! LỖI HỆ THỐNG?! SAO NGƯƠI CÓ THỂ ÉP ĐƯỢC TA?!', 'TĂNG XUNG NHỊP LÕI LÊN 400%! TA SẼ KHÔNG NGÃ XUỐNG!'],
        en: ['GRAAAH!! SYSTEM ANOMALY?! HOW ARE YOU PRESSING ME?!', 'OVERCLOCKING CORE TO 400%! I REFUSE TO FALL!']
      },
      win: {
        vi: ['HỦY DIỆT HOÀN TẤT. KHÔNG AI VƯỢT QUA ĐƯỢC YORHA TỐI THƯỢNG.', 'BÀN CỜ ĐÃ THÀNH TRO TÀN. HÃY QUAY LẠI KHI NGƯƠI ĐỦ MẠNH.'],
        en: ['ANNIHILATION COMPLETE. NONE SURPASS YORHA SUPREME.', 'THE BOARD LIES IN ASHES. RETURN WHEN YOU ARE WORTHY.']
      },
      lose: {
        vi: ['KHÔNG THỂ... LÕI TỐI THƯỢNG ĐÃ VỠ... NGƯƠI LÀ THẦN CỜ SAO, {name}?!', '[HỆ THỐNG SỤP ĐỔ] ...Ngươi đã chiến thắng cả cơn điên của mạng lưới.'],
        en: ['IMPOSSIBLE... THE SUPREME CORE SHATTERED... ARE YOU A CHESS GOD, {name}?!', '[SYSTEM COLLAPSE] ...You conquered the madness of the network.']
      },
      draw: {
        vi: ['NGƯƠI SỐNG SÓT QUA CƠN CUỒNG NỘ CỦA TA?! ĐÁNG KINH NGẠC!', 'HÒA CỜ TRƯỚC CẤP ĐỘ TỐI THƯỢNG — NGƯƠI XỨNG ĐÁNG ĐƯỢC GHI DANH!'],
        en: ['YOU SURVIVED MY BERSERK WRATH?! ASTONISHING!', 'A DRAW AGAINST SUPREME — YOUR NAME EARNS ETERNAL RECORD!']
      },
      thinking: {
        vi: ['[ĐANG TÍNH TOÁN 10^8 NÚT... TÌM ĐÒN KẾT LIỄU...]', '[TIẾNG RÈ NHIỄU]... TA ĐÃ NHÌN THẤY TƯƠNG LAI CỦA VÁN CỜ...'],
        en: ['[SEARCHING 10^8 NODES... LOCATING KILL SEQUENCE...]', '[STATIC GLITCH]... I SEE THE END OF THIS TIMELINE...']
      },
      takeback: {
        vi: ['QUAY LẠI ĐI! DÙ TRĂM LẦN NỮA TA VẪN SẼ NGHIỀN NÁT NGƯƠI!', 'THỬ LẠI ĐI CON NGƯỜI! TÌM XEM CÓ CON ĐƯỜNG SỐNG NÀO KHÔNG!'],
        en: ['REWIND IT! EVEN A HUNDRED TIMES OVER I WILL CRUSH YOU!', 'TRY AGAIN, MORTAL! SEE IF ANY PATH LEADS TO SURVIVAL!']
      }
    }
  };

  /* ------------------------------------------------------------------
     Escalating ferocity SVG portraits (viewBox 0 0 120 120)
     Tier 1: calm novice cadet, soft friendly eyes
     Tier 2: focused scout, slight brow furrow, scanner headset
     Tier 3: tactical visor/headband, sharp determined gaze
     Tier 4: stern veteran, battle scars, intense eyes
     Tier 5: half-masked combat android, glowing amber eyes, scowl
     Tier 6: fierce warlord, dark jagged armor plating, crimson eyes + aura
     Tier 7: hyper-intimidating berserk face, glitch artifacts, blazing red eyes, menacing grin
     ------------------------------------------------------------------ */
  function portrait(id, size) {
    size = size || 120;
    const bot = get(id) || list[0];
    const t = bot.tier;
    const head = '<svg viewBox="0 0 120 120" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + bot.name.en + '">';
    const grid =
      '<rect width="120" height="120" fill="' + (t >= 6 ? '#26231E' : '#3B3831') + '"/>' +
      '<g stroke="' + (t >= 6 ? 'rgba(184,58,45,0.22)' : 'rgba(218,212,187,0.12)') + '" stroke-width="1">' +
      '<line x1="0" y1="30" x2="120" y2="30"/><line x1="0" y1="60" x2="120" y2="60"/><line x1="0" y1="90" x2="120" y2="90"/>' +
      '<line x1="30" y1="0" x2="30" y2="120"/><line x1="60" y1="0" x2="60" y2="120"/><line x1="90" y1="0" x2="90" y2="120"/>' +
      '</g>' +
      '<rect x="3" y="3" width="114" height="114" fill="none" stroke="#DAD4BB" stroke-width="1.2" opacity="0.65"/>' +
      '<text x="7" y="13" fill="#DAD4BB" font-size="8" font-family="monospace" opacity="0.75">T-' + t + ' // ' + bot.elo + '</text>';

    let body = '';

    if (t === 1) {
      // Tier 1: Calm novice cadet, rounded helmet/hair, soft friendly cyan-grey eyes, gentle smile
      body =
        '<path d="M24 116 L32 90 L60 84 L88 90 L96 116 Z" fill="#4E4B42" stroke="#DAD4BB" stroke-width="1.5"/>' +
        '<rect x="52" y="76" width="16" height="12" fill="#DAD4BB"/>' +
        '<path d="M35 44 C35 24, 85 24, 85 44 L83 68 C83 80, 68 86, 60 86 C52 86, 37 80, 37 68 Z" fill="#EFECE6" stroke="#4E4B42" stroke-width="1.8"/>' +
        '<path d="M32 45 C32 20, 88 20, 88 45 L84 36 L60 32 L36 36 Z" fill="#CEC8B0" stroke="#4E4B42" stroke-width="1.5"/>' +
        '<rect x="40" y="25" width="40" height="5" fill="#4E4B42"/>' +
        '<circle cx="48" cy="54" r="4.2" fill="#2B8C84"/><circle cx="72" cy="54" r="4.2" fill="#2B8C84"/>' +
        '<circle cx="46.8" cy="52.6" r="1.4" fill="#EFECE6"/><circle cx="70.8" cy="52.6" r="1.4" fill="#EFECE6"/>' +
        '<path d="M42 47 Q48 44 54 47" fill="none" stroke="#4E4B42" stroke-width="1.6"/>' +
        '<path d="M66 47 Q72 44 78 47" fill="none" stroke="#4E4B42" stroke-width="1.6"/>' +
        '<path d="M52 71 Q60 76 68 71" fill="none" stroke="#4E4B42" stroke-width="1.8" stroke-linecap="round"/>';
    } else if (t === 2) {
      // Tier 2: Focused scout, side scanner earpiece, slight brow furrow
      body =
        '<path d="M22 116 L30 88 L60 82 L90 88 L98 116 Z" fill="#4E4B42" stroke="#DAD4BB" stroke-width="1.5"/>' +
        '<line x1="42" y1="92" x2="78" y2="92" stroke="#DAD4BB" stroke-width="1.5"/>' +
        '<rect x="52" y="75" width="16" height="12" fill="#CEC8B0"/>' +
        '<path d="M35 42 L40 24 L80 24 L85 42 L82 69 L60 86 L38 69 Z" fill="#EFECE6" stroke="#4E4B42" stroke-width="1.8"/>' +
        '<path d="M33 42 L40 20 L82 22 L87 40 L74 33 L46 35 Z" fill="#CEC8B0" stroke="#4E4B42" stroke-width="1.5"/>' +
        '<rect x="82" y="46" width="8" height="16" fill="#4E4B42" stroke="#DAD4BB" stroke-width="1.2"/>' +
        '<circle cx="86" cy="54" r="2.2" fill="#2B8C84"/>' +
        '<path d="M41 48 L55 51" stroke="#3B3831" stroke-width="2"/><path d="M79 48 L65 51" stroke="#3B3831" stroke-width="2"/>' +
        '<polygon points="43,54 54,54 52,58 45,58" fill="#2B8C84"/>' +
        '<polygon points="66,54 77,54 75,58 68,58" fill="#2B8C84"/>' +
        '<line x1="52" y1="72" x2="68" y2="71" stroke="#3B3831" stroke-width="1.8"/>';
    } else if (t === 3) {
      // Tier 3: Tactical visor/headband covering upper eyes with cyan optic slit, sharp determined jaw
      body =
        '<path d="M18 116 L28 86 L60 80 L92 86 L102 116 Z" fill="#3B3831" stroke="#DAD4BB" stroke-width="1.6"/>' +
        '<polygon points="46,84 60,104 74,84" fill="none" stroke="#DAD4BB" stroke-width="1.4"/>' +
        '<path d="M35 40 L42 22 L78 22 L85 40 L82 68 L60 86 L38 68 Z" fill="#DAD4BB" stroke="#3B3831" stroke-width="1.8"/>' +
        '<path d="M32 36 L44 18 L78 18 L88 36 L76 30 L44 30 Z" fill="#EFECE6" stroke="#3B3831" stroke-width="1.5"/>' +
        '<polygon points="31,45 89,45 85,59 60,62 35,59" fill="#26231E" stroke="#DAD4BB" stroke-width="1.4"/>' +
        '<polygon points="38,52 56,54 56,56 38,55" fill="#2B8C84"/>' +
        '<polygon points="82,52 64,54 64,56 82,55" fill="#2B8C84"/>' +
        '<line x1="50" y1="73" x2="70" y2="73" stroke="#3B3831" stroke-width="2"/>';
    } else if (t === 4) {
      // Tier 4: Stern veteran, angular armor collar, diagonal battle scars, intense sharp eyes
      body =
        '<polygon points="14,116 26,82 60,78 94,82 106,116" fill="#2E2B25" stroke="#DAD4BB" stroke-width="1.8"/>' +
        '<polygon points="26,82 44,96 40,116 18,116" fill="#4E4B42"/>' +
        '<polygon points="94,82 76,96 80,116 102,116" fill="#4E4B42"/>' +
        '<polygon points="34,38 44,20 76,20 86,38 82,68 60,86 38,68" fill="#CEC8B0" stroke="#26231E" stroke-width="2"/>' +
        '<polygon points="32,36 46,16 74,16 88,36 74,28 46,28" fill="#8E8878" stroke="#26231E" stroke-width="1.5"/>' +
        '<line x1="42" y1="36" x2="54" y2="68" stroke="#B83A2D" stroke-width="2"/>' +
        '<line x1="45" y1="34" x2="57" y2="66" stroke="#3B3831" stroke-width="1"/>' +
        '<line x1="68" y1="62" x2="78" y2="75" stroke="#3B3831" stroke-width="1.6"/>' +
        '<polygon points="39,46 57,51 56,54 39,50" fill="#26231E"/>' +
        '<polygon points="81,46 63,51 64,54 81,50" fill="#26231E"/>' +
        '<polygon points="42,53 55,54 53,58 43,57" fill="#D99B26"/>' +
        '<polygon points="78,53 65,54 67,58 77,57" fill="#D99B26"/>' +
        '<path d="M49 74 L60 71 L71 74" fill="none" stroke="#26231E" stroke-width="2.2"/>';
    } else if (t === 5) {
      // Tier 5: Half-masked Executioner android, lower face armored respirator, glowing amber eyes, aggressive brows
      body =
        '<polygon points="12,116 24,80 60,74 96,80 108,116" fill="#26231E" stroke="#DAD4BB" stroke-width="1.8"/>' +
        '<line x1="34" y1="84" x2="50" y2="116" stroke="#B88A2D" stroke-width="1.5"/>' +
        '<line x1="86" y1="84" x2="70" y2="116" stroke="#B88A2D" stroke-width="1.5"/>' +
        '<polygon points="33,36 45,18 75,18 87,36 83,68 60,86 37,68" fill="#DAD4BB" stroke="#26231E" stroke-width="2"/>' +
        '<polygon points="30,36 44,14 76,14 90,36 78,28 42,28" fill="#EFECE6" stroke="#26231E" stroke-width="1.6"/>' +
        // half mask covering nose + jaw
        '<polygon points="36,58 60,52 84,58 81,74 60,87 39,74" fill="#26231E" stroke="#DAD4BB" stroke-width="1.5"/>' +
        '<line x1="46" y1="64" x2="74" y2="64" stroke="#7A7567" stroke-width="1.4"/>' +
        '<line x1="48" y1="70" x2="72" y2="70" stroke="#7A7567" stroke-width="1.4"/>' +
        '<line x1="52" y1="76" x2="68" y2="76" stroke="#B88A2D" stroke-width="1.4"/>' +
        // fierce amber eyes
        '<polygon points="37,43 58,50 57,53 37,47" fill="#26231E"/>' +
        '<polygon points="83,43 62,50 63,53 83,47" fill="#26231E"/>' +
        '<polygon points="40,50 56,52 53,56 41,55" fill="#F2A922"/>' +
        '<polygon points="80,50 64,52 67,56 79,55" fill="#F2A922"/>' +
        '<circle cx="48" cy="53" r="1.6" fill="#FFF7D6"/><circle cx="72" cy="53" r="1.6" fill="#FFF7D6"/>';
    } else if (t === 6) {
      // Tier 6: Grandmaster Warlord, crimson aura, dark jagged armor horns/plates, bright crimson eyes + scowl
      body =
        '<circle cx="60" cy="56" r="46" fill="none" stroke="#B83A2D" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.7"/>' +
        '<polygon points="10,116 20,76 60,70 100,76 110,116" fill="#1B1916" stroke="#B83A2D" stroke-width="1.8"/>' +
        '<polygon points="18,74 36,60 40,86" fill="#2E2B25" stroke="#DAD4BB" stroke-width="1.2"/>' +
        '<polygon points="102,74 84,60 80,86" fill="#2E2B25" stroke="#DAD4BB" stroke-width="1.2"/>' +
        // horned crest
        '<polygon points="26,14 44,32 34,38" fill="#1B1916" stroke="#B83A2D" stroke-width="1.5"/>' +
        '<polygon points="94,14 76,32 86,38" fill="#1B1916" stroke="#B83A2D" stroke-width="1.5"/>' +
        '<polygon points="32,34 46,18 74,18 88,34 84,68 60,88 36,68" fill="#3B3831" stroke="#DAD4BB" stroke-width="2"/>' +
        '<polygon points="44,20 60,34 76,20" fill="#1B1916" stroke="#B83A2D" stroke-width="1.2"/>' +
        // crimson eyes with glow
        '<polygon points="37,43 58,52 39,56" fill="#B83A2D"/>' +
        '<polygon points="83,43 62,52 81,56" fill="#B83A2D"/>' +
        '<polygon points="41,47 55,52 43,54" fill="#FFD4CE"/>' +
        '<polygon points="79,47 65,52 77,54" fill="#FFD4CE"/>' +
        // jagged scowl
        '<polygon points="44,73 52,69 60,72 68,69 76,73 68,77 52,77" fill="#1B1916" stroke="#B83A2D" stroke-width="1.3"/>';
    } else {
      // Tier 7: YoRHa Supreme — Berserk corrupted core, glitch bars, spiked crown, blazing red eyes + eye trails, menacing toothed grin
      body =
        '<rect x="8" y="22" width="26" height="3" fill="#B83A2D" opacity="0.85"/>' +
        '<rect x="86" y="40" width="28" height="3" fill="#2B8C84" opacity="0.75"/>' +
        '<rect x="6" y="78" width="22" height="4" fill="#B83A2D" opacity="0.85"/>' +
        '<rect x="90" y="64" width="24" height="2.5" fill="#B83A2D" opacity="0.9"/>' +
        '<circle cx="60" cy="56" r="49" fill="none" stroke="#B83A2D" stroke-width="2.2" stroke-dasharray="9 4"/>' +
        '<polygon points="8,116 18,74 60,68 102,74 112,116" fill="#141210" stroke="#B83A2D" stroke-width="2"/>' +
        // spiked berserk crown
        '<polygon points="20,10 40,30 30,38" fill="#B83A2D"/>' +
        '<polygon points="100,10 80,30 90,38" fill="#B83A2D"/>' +
        '<polygon points="60,6 52,24 68,24" fill="#B83A2D"/>' +
        '<polygon points="31,32 46,18 74,18 89,32 85,70 60,90 35,70" fill="#1F1C18" stroke="#EFECE6" stroke-width="2"/>' +
        // crack lines across face
        '<polyline points="60,18 55,36 63,46 58,62" fill="none" stroke="#B83A2D" stroke-width="1.8"/>' +
        // blazing crimson eyes + energy trails
        '<polygon points="34,40 58,51 38,57" fill="#FF2E1F"/>' +
        '<polygon points="86,40 62,51 82,57" fill="#FF2E1F"/>' +
        '<polyline points="36,46 22,36 10,38" fill="none" stroke="#FF2E1F" stroke-width="2"/>' +
        '<polyline points="84,46 98,36 110,38" fill="none" stroke="#FF2E1F" stroke-width="2"/>' +
        '<circle cx="46" cy="50" r="2.2" fill="#FFFFFF"/><circle cx="74" cy="50" r="2.2" fill="#FFFFFF"/>' +
        // menacing berserk grin with teeth
        '<polygon points="40,66 60,71 80,66 76,80 60,84 44,80" fill="#B83A2D" stroke="#EFECE6" stroke-width="1.4"/>' +
        '<line x1="48" y1="68" x2="48" y2="80" stroke="#141210" stroke-width="1.6"/>' +
        '<line x1="54" y1="70" x2="54" y2="82" stroke="#141210" stroke-width="1.6"/>' +
        '<line x1="60" y1="71" x2="60" y2="83" stroke="#141210" stroke-width="1.6"/>' +
        '<line x1="66" y1="70" x2="66" y2="82" stroke="#141210" stroke-width="1.6"/>' +
        '<line x1="72" y1="68" x2="72" y2="80" stroke="#141210" stroke-width="1.6"/>';
    }

    return head + grid + body + '</svg>';
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
