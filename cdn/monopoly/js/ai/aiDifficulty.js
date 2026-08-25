// js/ai/aiDifficulty.js
// Định nghĩa hành vi và chiến thuật cụ thể cho 4 cấp độ AI: Easy, Normal, Hard, Very Hard

import { state } from '../state.js';
import { AIEvaluator } from './aiEvaluator.js';
import { PROPERTY_GROUPS, COLOR_GROUPS } from '../data/boardData.js';
import { manage } from '../manage.js';

export class AIDifficulty {
    // 1. Quyết định có Mua Bất Động Sản khi dẫm vào ô trống không
    static shouldBuyProperty(player, tile) {
        if (player.money < tile.price) return false;

        const reserve = AIEvaluator.getRequiredCashReserve(player.id, player.difficulty);
        const cashAfterBuy = player.money - tile.price;

        switch (player.difficulty) {
            case 'easy':
                // AI Dễ: Cứ có đủ tiền là 85% sẽ mua, không màng dự phòng rủi ro
                return Math.random() < 0.85;

            case 'normal':
                // AI Tiêu chuẩn: Mua nếu còn lại ít nhất 50% mức dự phòng an toàn
                return cashAfterBuy >= (reserve * 0.5);

            case 'hard':
                // AI Khó: Luôn mua nếu là nhóm Cam/Đỏ/Ga xe lửa hoặc hoàn thành Monopoly;
                // Nếu là nhóm khác thì chỉ mua khi còn đủ 100% quỹ dự phòng.
                const isHighPriority = ['ORANGE', 'RED', 'RAILROAD'].includes(tile.group);
                const completesMonopoly = AIEvaluator.evaluateProperty(tile.id, player.id, 'hard') > (tile.price * 2);
                if (isHighPriority || completesMonopoly) {
                    return cashAfterBuy >= 30; // Chấp nhận mạo hiểm hơn để chiếm đất vàng
                }
                return cashAfterBuy >= reserve;

            case 'very_hard':
                // AI Bậc Thầy: Tính toán giá trị chiến lược tối đa
                // Luôn mua để chặn người chơi khác hoặc xây dựng đế chế
                const propVal = AIEvaluator.evaluateProperty(tile.id, player.id, 'very_hard');
                if (propVal > tile.price * 1.3) {
                    return cashAfterBuy >= 20; // Quyết tâm mua
                }
                return cashAfterBuy >= reserve;

            default:
                return cashAfterBuy >= reserve;
        }
    }

    // 2. Quyết định Xây Nhà / Khách Sạn
    static getBuildingPlans(player) {
        const owned = state.getPlayerProperties(player.id);
        const buildPlans = []; // danh sách tileId cần xây

        // Tìm các nhóm màu đã độc quyền
        const monopolies = [];
        for (const [groupKey, tileIds] of Object.entries(PROPERTY_GROUPS)) {
            if (groupKey === 'RAILROAD' || groupKey === 'UTILITY') continue;
            const status = state.getColorGroupStatus(groupKey);
            if (status.isMonopoly && status.ownerId === player.id) {
                monopolies.push({ groupKey, tileIds });
            }
        }

        if (monopolies.length === 0) return buildPlans;

        // Sắp xếp nhóm màu ưu tiên xây dựng theo độ khó
        monopolies.sort((a, b) => {
            const weightA = AIEvaluator.GROUP_IMPORTANCE[a.groupKey] || 1.0;
            const weightB = AIEvaluator.GROUP_IMPORTANCE[b.groupKey] || 1.0;
            return weightB - weightA;
        });

        const reserve = AIEvaluator.getRequiredCashReserve(player.id, player.difficulty);
        let simulatedMoney = player.money;

        for (const mono of monopolies) {
            const groupInfo = COLOR_GROUPS[mono.groupKey];
            const houseCost = groupInfo.houseCost;

            // Lặp các vòng xây nhà đồng đều
            let continueBuilding = true;
            while (continueBuilding) {
                continueBuilding = false;

                // Mục tiêu số nhà tối đa cần xây theo cấp độ
                let targetMaxHouses = 5;
                if (player.difficulty === 'easy') {
                    targetMaxHouses = Math.floor(Math.random() * 3) + 1; // Xây lung tung 1-3 nhà
                } else if (player.difficulty === 'hard' || player.difficulty === 'very_hard') {
                    // Cấp độ khó: Ưu tiên xây nhanh 3 nhà trên mỗi ô (Điểm bùng nổ ROI tốt nhất của Monopoly)
                    // Sau đó mới nâng tiếp lên 4 nhà và Khách sạn
                    targetMaxHouses = 5;
                }

                for (const tileId of mono.tileIds) {
                    const prop = state.properties[tileId];
                    if (!prop || prop.houses >= targetMaxHouses || prop.isMortgaged) continue;

                    if (simulatedMoney - houseCost >= reserve) {
                        const canBuild = manage.canBuildHouse(player.id, tileId);
                        if (canBuild.allowed) {
                            buildPlans.push(tileId);
                            simulatedMoney -= houseCost;
                            continueBuilding = true;
                        }
                    }
                }
            }
        }

        return buildPlans;
    }

    // 3. Quyết định Chuộc Đất (Unmortgage)
    static getUnmortgagePlans(player) {
        const owned = state.getPlayerProperties(player.id);
        const plans = [];
        const mortgaged = owned.filter(p => p.isMortgaged);
        if (mortgaged.length === 0) return plans;

        const reserve = AIEvaluator.getRequiredCashReserve(player.id, player.difficulty);
        let simulatedMoney = player.money;

        // Ưu tiên chuộc tài sản thuộc nhóm sắp hoàn thành Monopoly hoặc có giá trị cao
        mortgaged.sort((a, b) => {
            const valA = AIEvaluator.evaluateProperty(a.id, player.id, player.difficulty);
            const valB = AIEvaluator.evaluateProperty(b.id, player.id, player.difficulty);
            return valB - valA;
        });

        for (const prop of mortgaged) {
            if (simulatedMoney - prop.unmortgageCost >= reserve) {
                plans.push(prop.id);
                simulatedMoney -= prop.unmortgageCost;
            }
        }

        return plans;
    }

    // 4. Quyết định ở Trong Tù: Trả $50 ra tù ngay hay Đổ xúc xắc thử vận may?
    // Chiến thuật Monopoly chuyên nghiệp:
    // - Đầu game: Ra tù càng nhanh càng tốt để đi mua đất còn trống.
    // - Cuối game: Khi đối thủ đã xây nhiều nhà/khách sạn trên bàn cờ, ở lại trong tù 3 lượt là an toàn nhất!
    static shouldPayToLeaveJail(player) {
        if (player.jailCards > 0) return 'USE_CARD';

        // Đếm số lượng đất chưa có chủ trên toàn bàn cờ
        let unownedCount = 0;
        for (const [tileIdStr, prop] of Object.entries(state.properties)) {
            if (prop.ownerId === null) unownedCount++;
        }

        const isEarlyGame = unownedCount > 10;

        switch (player.difficulty) {
            case 'easy':
                return (player.money >= 100 && Math.random() < 0.5) ? 'PAY_50' : 'ROLL_DOUBLES';

            case 'normal':
                if (isEarlyGame && player.money >= 200) return 'PAY_50';
                return 'ROLL_DOUBLES';

            case 'hard':
            case 'very_hard':
                // Đầu game: Ra tù ngay lập tức để tranh giành đất
                if (isEarlyGame && player.money >= 150) return 'PAY_50';
                // Cuối game: Tận dụng thời gian ở tù an toàn, chỉ đổ xúc xắc
                return 'ROLL_DOUBLES';

            default:
                return 'ROLL_DOUBLES';
        }
    }

    // 5. AI Chủ Động Đề Xuất Giao Dịch (Proactive Trade Proposals)
    static generateProactiveTrade(player) {
        if (player.difficulty === 'easy') return null; // Dễ không chủ động giao dịch
        if (Math.random() > 0.4) return null; // Tránh spam giao dịch mỗi lượt

        // Tìm các nhóm màu mà AI đang thiếu đúng 1 ô để hoàn thành Monopoly
        const targets = [];
        for (const [groupKey, tileIds] of Object.entries(PROPERTY_GROUPS)) {
            if (groupKey === 'SPECIAL') continue;
            let aiOwned = 0;
            let missingTileId = null;
            let missingOwnerId = null;

            tileIds.forEach(id => {
                const p = state.properties[id];
                if (p.ownerId === player.id) {
                    aiOwned++;
                } else if (p.ownerId !== null) {
                    missingTileId = id;
                    missingOwnerId = p.ownerId;
                }
            });

            if (aiOwned === tileIds.length - 1 && missingTileId !== null && missingOwnerId !== null) {
                targets.push({ groupKey, missingTileId, missingOwnerId });
            }
        }

        if (targets.length === 0) return null;

        const target = targets[0];
        const missingTile = state.getTile(target.missingTileId);
        const opponent = state.getPlayer(target.missingOwnerId);
        if (!opponent || opponent.bankrupt) return null;

        // Tìm tài sản thừa của AI không thuộc nhóm quan trọng để mang đi đổi
        const aiProps = state.getPlayerProperties(player.id);
        const spareProps = aiProps.filter(p => {
            const status = state.getColorGroupStatus(p.group);
            return !status.isMonopoly && p.houses === 0;
        });

        const offeredPropIds = spareProps.slice(0, 1).map(p => p.id);
        // Tính toán tiền mặt kèm theo
        let offeredCash = missingTile.price;
        if (player.difficulty === 'very_hard') {
            offeredCash = Math.min(player.money - 100, Math.round(missingTile.price * 1.5));
        } else if (player.difficulty === 'hard') {
            offeredCash = Math.min(player.money - 80, Math.round(missingTile.price * 1.2));
        }

        if (offeredCash < 0) offeredCash = 0;

        return {
            senderId: player.id,
            receiverId: opponent.id,
            offeredMoney: offeredCash,
            offeredProperties: offeredPropIds,
            requestedMoney: 0,
            requestedProperties: [target.missingTileId]
        };
    }
}
