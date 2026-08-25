// js/ai/aiEvaluator.js
// Bộ Đánh Giá Chiến Thuật và Định Giá Tài Sản Nâng Cao cho AI

import { state } from '../state.js';
import { PROPERTY_GROUPS, COLOR_GROUPS } from '../data/boardData.js';

export class AIEvaluator {
    // Trọng số xác suất đáp xuống ô của Monopoly cổ điển
    // Ô Cam (Orange), Đỏ (Red) và Ga Xe Lửa có xác suất đáp trúng cao nhất do vị trí sau ô Vào Tù (Jail)
    static GROUP_IMPORTANCE = {
        ORANGE: 1.45,   // 6, 8, 9 bước sau Jail -> Tỷ lệ đáp trúng cực cao
        RED: 1.35,      // 11, 13, 14 bước sau Jail
        RAILROAD: 1.30, // 4 ô rải đều khắp bàn cờ
        YELLOW: 1.20,
        LIGHT_BLUE: 1.15,
        PINK: 1.10,
        DARK_BLUE: 1.10, // Sát thương cao nhưng ít ô
        GREEN: 1.00,    // Đắt, ROI chậm
        BROWN: 0.90,    // Rẻ, dễ xây nhưng sát thương thấp
        UTILITY: 0.75
    };

    // Đánh giá giá trị thực tế của một bất động sản đối với một người chơi cụ thể
    static evaluateProperty(tileId, playerId, aiDifficulty = 'normal') {
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];
        if (!tile || !prop) return 0;

        let baseValue = tile.price;
        if (prop.isMortgaged) baseValue = tile.mortgageValue;

        const groupWeight = this.GROUP_IMPORTANCE[tile.group] || 1.0;
        let strategicValue = baseValue * groupWeight;

        // Đánh giá tiềm năng Monopoly (Độc quyền)
        const groupTiles = PROPERTY_GROUPS[tile.group] || [];
        let playerOwnedInGroup = 0;
        let opponentOwnedInGroup = 0;

        groupTiles.forEach(id => {
            const p = state.properties[id];
            if (p.ownerId === playerId) playerOwnedInGroup++;
            else if (p.ownerId !== null) opponentOwnedInGroup++;
        });

        // Nếu việc sở hữu ô này giúp hoàn thành trọn bộ Monopoly
        if (playerOwnedInGroup === groupTiles.length - 1 && opponentOwnedInGroup === 0) {
            if (aiDifficulty === 'very_hard') strategicValue *= 3.5;
            else if (aiDifficulty === 'hard') strategicValue *= 2.8;
            else if (aiDifficulty === 'normal') strategicValue *= 1.8;
            else strategicValue *= 1.2;
        } 
        // Nếu ô này là mảnh ghép thứ 2 trong nhóm 3 ô
        else if (playerOwnedInGroup === 1 && groupTiles.length === 3) {
            if (aiDifficulty === 'very_hard' || aiDifficulty === 'hard') strategicValue *= 1.5;
            else strategicValue *= 1.2;
        }

        // Đánh giá giá trị CHẶN đối thủ hoàn thành Monopoly (Block Opponent)
        if (aiDifficulty === 'hard' || aiDifficulty === 'very_hard') {
            state.players.forEach(opp => {
                if (opp.id !== playerId && !opp.bankrupt) {
                    let oppCount = 0;
                    groupTiles.forEach(id => {
                        if (state.properties[id].ownerId === opp.id) oppCount++;
                    });
                    if (oppCount === groupTiles.length - 1) {
                        // Đối thủ chỉ thiếu đúng ô này để hoàn thành bộ màu!
                        strategicValue *= (aiDifficulty === 'very_hard') ? 2.5 : 1.8;
                    }
                }
            });
        }

        return Math.round(strategicValue);
    }

    // Tính toán vùng đệm tiền mặt an toàn (Safety Reserve)
    // AI không nên tiêu hết sạch tiền để tránh nguy cơ phá sản khi dẫm phải ô của đối thủ
    static getRequiredCashReserve(playerId, aiDifficulty = 'normal') {
        const player = state.getPlayer(playerId);
        if (!player) return 100;

        // Tìm mức tiền thuê cao nhất trên bàn cờ thuộc về đối thủ
        let maxOpponentRent = 50;
        for (const [tileIdStr, prop] of Object.entries(state.properties)) {
            if (prop.ownerId !== null && prop.ownerId !== playerId && !prop.isMortgaged) {
                const rent = state.calculateRent(parseInt(tileIdStr, 10));
                if (rent > maxOpponentRent) maxOpponentRent = rent;
            }
        }

        switch (aiDifficulty) {
            case 'easy':
                return 30; // Dễ: Liều lĩnh, giữ cực ít tiền dự phòng
            case 'normal':
                return Math.min(200, Math.max(100, maxOpponentRent * 0.6));
            case 'hard':
                return Math.min(400, Math.max(150, maxOpponentRent * 1.1));
            case 'very_hard':
                // Bậc thầy: Tính toán xác suất, duy trì dự phòng có thể chống chịu 1 cú shock lớn
                return Math.min(500, Math.max(200, maxOpponentRent * 1.3));
            default:
                return 150;
        }
    }

    // Đánh giá giá trị của một đề xuất Giao dịch (Trade Evaluation)
    // Trả về { accept: boolean, scoreDifference: number, reason: string }
    static evaluateTradeOffer(receiverId, offeredMoney, offeredPropertyIds, requestedMoney, requestedPropertyIds, aiDifficulty = 'normal') {
        const receiver = state.getPlayer(receiverId);
        if (!receiver) return { accept: false, scoreDifference: -999, reason: 'Người nhận không tồn tại' };

        // Giá trị tài sản nhận được
        let valueReceived = offeredMoney;
        offeredPropertyIds.forEach(id => {
            valueReceived += this.evaluateProperty(id, receiverId, aiDifficulty);
        });

        // Giá trị tài sản bị yêu cầu nhượng lại
        let valueGiven = requestedMoney;
        requestedPropertyIds.forEach(id => {
            valueGiven += this.evaluateProperty(id, receiverId, aiDifficulty);
        });

        // Kiểm tra xem giao dịch có trao trọn bộ Monopoly cho người đề xuất hay không
        let givesOpponentMonopoly = false;
        requestedPropertyIds.forEach(id => {
            const tile = state.getTile(id);
            const groupTiles = PROPERTY_GROUPS[tile.group] || [];
            let countOther = 0;
            groupTiles.forEach(gid => {
                if (gid !== id && state.properties[gid].ownerId !== receiverId && state.properties[gid].ownerId !== null) {
                    countOther++;
                }
            });
            if (countOther === groupTiles.length - 1) {
                givesOpponentMonopoly = true;
            }
        });

        // Tính ngưỡng chênh lệch chấp nhận theo cấp độ AI
        let minRatio = 1.0;
        if (aiDifficulty === 'easy') {
            minRatio = 0.85; // Dễ dãi, chấp nhận lỗ nhẹ
        } else if (aiDifficulty === 'normal') {
            minRatio = 1.05; // Cần lời nhẹ hoặc ngang bằng
            if (givesOpponentMonopoly) minRatio = 1.3;
        } else if (aiDifficulty === 'hard') {
            minRatio = 1.2; // Cần có lợi rõ ràng
            if (givesOpponentMonopoly) minRatio = 1.8; // Nếu trao Monopoly cho đối thủ phải đòi giá cực đắt
        } else if (aiDifficulty === 'very_hard') {
            minRatio = 1.35; // Rất tính toán và khắt khe
            if (givesOpponentMonopoly) minRatio = 2.4;
        }

        const scoreDiff = valueReceived - (valueGiven * minRatio);
        const willAccept = scoreDiff >= 0;

        let reason = willAccept ? 'Thỏa thuận hợp lý' : 'Đề nghị này không có lợi cho tôi!';
        if (givesOpponentMonopoly && !willAccept) {
            reason = 'Tôi không thể trao cho bạn trọn bộ độc quyền nhóm màu với giá này!';
        }

        return {
            accept: willAccept,
            scoreDifference: scoreDiff,
            valueReceived,
            valueGiven,
            reason
        };
    }
}
