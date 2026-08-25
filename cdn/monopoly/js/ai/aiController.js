// js/ai/aiController.js
// Điều phối Lượt Chơi Tự Động của AI

import { state } from '../state.js';
import { sound } from '../audio.js';
import { board } from '../board.js';
import { dice } from '../dice.js';
import { AIDifficulty } from './aiDifficulty.js';
import { manage } from '../manage.js';
import { trade } from '../trade.js';

export class AIController {
    constructor() {
        this.isExecuting = false;
    }

    async executeTurn(gameEngine) {
        if (this.isExecuting) return;
        this.isExecuting = true;
        state.isAiProcessing = true;

        const player = state.getActivePlayer();
        if (!player || !player.isAI || player.bankrupt) {
            this.isExecuting = false;
            state.isAiProcessing = false;
            return;
        }

        const getDelay = (baseMs) => {
            if (state.gameSpeed === 'instant') return 50;
            if (state.gameSpeed === 'fast') return Math.floor(baseMs * 0.4);
            return baseMs;
        };

        await new Promise(r => setTimeout(r, getDelay(600)));

        // 1. Kiểm tra trạng thái Trong Tù (Jail)
        if (player.inJail) {
            const jailChoice = AIDifficulty.shouldPayToLeaveJail(player);
            if (jailChoice === 'USE_CARD' && player.jailCards > 0) {
                player.jailCards--;
                player.inJail = false;
                player.jailTurns = 0;
                sound.playUnjail();
                state.addLog(`<strong>${player.name} (AI)</strong> đã sử dụng Thẻ Ra Tù Miễn Phí.`, 'success', player.id);
            } else if (jailChoice === 'PAY_50' && player.money >= 50) {
                player.money -= 50;
                player.inJail = false;
                player.jailTurns = 0;
                sound.playUnjail();
                state.addLog(`<strong>${player.name} (AI)</strong> đã nộp phạt $50 bảo lãnh để ra tù.`, 'warning', player.id);
            } else {
                player.jailTurns++;
                state.addLog(`<strong>${player.name} (AI)</strong> quyết định tung xúc xắc thử vận may để thoát tù (Lần ${player.jailTurns}/3).`, 'info', player.id);
            }
            await new Promise(r => setTimeout(r, getDelay(400)));
        }

        // 2. Chuộc đất trước khi đi (nếu dư dả tiền)
        const unmortgagePlans = AIDifficulty.getUnmortgagePlans(player);
        for (const tileId of unmortgagePlans) {
            manage.unmortgageProperty(player.id, tileId);
            await new Promise(r => setTimeout(r, getDelay(200)));
        }

        // 3. Đổ xúc xắc
        const rollResult = await dice.roll(state.gameSpeed);
        state.diceState = rollResult;

        const diceTextEl = document.getElementById('dice-result-text');
        if (diceTextEl) {
            diceTextEl.textContent = `${player.name} đổ được: ${rollResult.die1} + ${rollResult.die2} = ${rollResult.total} ${rollResult.isDouble ? '(ĐÔI!)' : ''}`;
        }

        // Xử lý thoát tù bằng xúc xắc đôi
        if (player.inJail) {
            if (rollResult.isDouble) {
                player.inJail = false;
                player.jailTurns = 0;
                sound.playUnjail();
                state.addLog(`<strong>${player.name} (AI)</strong> đã đổ được xúc xắc ĐÔI (${rollResult.die1}-${rollResult.die2}) và thoát khỏi Tù!`, 'success', player.id);
            } else if (player.jailTurns >= 3) {
                // Đã hết 3 lượt thử, bắt buộc nộp $50 và được đi
                player.money -= 50;
                player.inJail = false;
                player.jailTurns = 0;
                sound.playUnjail();
                state.addLog(`<strong>${player.name} (AI)</strong> hết 3 lượt trong tù, nộp phạt $50 và tiến bước.`, 'warning', player.id);
            } else {
                state.addLog(`<strong>${player.name} (AI)</strong> không đổ được đôi và tiếp tục ở lại trong Tù.`, 'info', player.id);
                this.isExecuting = false;
                state.isAiProcessing = false;
                await new Promise(r => setTimeout(r, getDelay(500)));
                gameEngine.endTurn();
                return;
            }
        }

        // Kiểm tra luật 3 lần đổ đôi liên tiếp
        if (rollResult.isDouble) {
            state.doublesRolledCount++;
            if (state.doublesRolledCount >= 3) {
                state.addLog(`<strong>${player.name} (AI)</strong> đổ đôi 3 lần liên tiếp và bị bắt vào Tù!`, 'danger', player.id);
                player.position = 10;
                player.inJail = true;
                player.jailTurns = 0;
                player.stats.timesInJail++;
                board.updatePlayerTokens();
                sound.playJail();
                this.isExecuting = false;
                state.isAiProcessing = false;
                await new Promise(r => setTimeout(r, getDelay(600)));
                gameEngine.endTurn();
                return;
            }
        } else {
            state.doublesRolledCount = 0;
        }

        // 4. Di chuyển token
        const oldPos = player.position;
        const newPos = (oldPos + rollResult.total) % 40;

        // Đi qua ô GO
        if (newPos < oldPos) {
            player.money += 200;
            sound.playBuy();
            state.addLog(`<strong>${player.name} (AI)</strong> đi qua ô Bắt Đầu (GO) và nhận $200!`, 'success', player.id);
        }

        await board.animatePlayerMove(player.id, oldPos, newPos, state.gameSpeed);

        // 5. Xử lý ô đáp xuống
        await gameEngine.handleTileLanding(player, newPos);

        if (player.bankrupt) {
            this.isExecuting = false;
            state.isAiProcessing = false;
            return;
        }

        await new Promise(r => setTimeout(r, getDelay(400)));

        // 6. Xây dựng Nhà / Khách sạn sau khi di chuyển
        const buildPlans = AIDifficulty.getBuildingPlans(player);
        for (const tileId of buildPlans) {
            manage.buildHouse(player.id, tileId);
            await new Promise(r => setTimeout(r, getDelay(250)));
        }

        // 7. AI chủ động đề xuất giao dịch (nếu có cơ hội tạo Monopoly)
        const proactiveTrade = AIDifficulty.generateProactiveTrade(player);
        if (proactiveTrade) {
            const receiver = state.getPlayer(proactiveTrade.receiverId);
            if (receiver && !receiver.bankrupt) {
                state.addLog(`<strong>${player.name} (AI)</strong> đang chuẩn bị đề xuất giao dịch với <strong>${receiver.name}</strong>...`, 'trade');
                await new Promise(r => setTimeout(r, getDelay(500)));
                
                if (!receiver.isAI) {
                    // Mở giao dịch tới Người chơi thật
                    const offerSummary = `
                        🤖 [${player.name} (${player.difficulty.toUpperCase()} AI)] gửi đề nghị giao dịch:
                        - AI gửi cho bạn: $${proactiveTrade.offeredMoney} ${proactiveTrade.offeredProperties.length > 0 ? `+ BĐS: ${state.getTile(proactiveTrade.offeredProperties[0]).name}` : ''}
                        - AI muốn nhận lại: BĐS ${state.getTile(proactiveTrade.requestedProperties[0]).name}
                        Bạn có đồng ý không?
                    `;
                    const accept = confirm(offerSummary);
                    if (accept) {
                        trade.executeTrade(player.id, receiver.id, proactiveTrade.offeredMoney, proactiveTrade.offeredProperties, proactiveTrade.requestedMoney, proactiveTrade.requestedProperties);
                        state.addLog(`Bạn đã chấp thuận đề nghị giao dịch của <strong>${player.name} (AI)</strong>!`, 'success');
                    } else {
                        state.addLog(`Bạn đã từ chối đề nghị giao dịch của <strong>${player.name} (AI)</strong>.`, 'warning');
                    }
                }
            }
        }

        this.isExecuting = false;
        state.isAiProcessing = false;

        // Nếu đổ đôi và chưa vào tù, AI được đi thêm lượt
        if (rollResult.isDouble && !player.inJail) {
            state.addLog(`<strong>${player.name} (AI)</strong> đổ được đôi nên được tung tiếp!`, 'info', player.id);
            await new Promise(r => setTimeout(r, getDelay(600)));
            await this.executeTurn(gameEngine);
        } else {
            await new Promise(r => setTimeout(r, getDelay(500)));
            gameEngine.endTurn();
        }
    }
}

export const aiController = new AIController();
