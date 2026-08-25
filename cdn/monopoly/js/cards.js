// js/cards.js
// Quản lý Rút Thẻ Khí Vận & Cơ Hội và Thực Thi Hiệu Lực Thẻ

import { state } from './state.js';
import { sound } from './audio.js';
import { board } from './board.js';

export class CardManager {
    constructor() {
        this.cardModalEl = null;
        this.resolvePromise = null;
    }

    init() {
        this.cardModalEl = document.getElementById('card-modal');
    }

    // Rút thẻ từ bộ Chance hoặc Chest
    async drawCard(type, playerId, onTileActionNeeded = null) {
        sound.playCardDraw();
        const player = state.getPlayer(playerId);

        let deck = (type === 'CHANCE') ? state.chanceDeck : state.chestDeck;
        let discard = (type === 'CHANCE') ? state.chanceDiscard : state.chestDiscard;

        // Tự động xáo lại nếu hết bài
        if (deck.length === 0) {
            deck = state.shuffle([...discard]);
            discard.length = 0;
            if (type === 'CHANCE') state.chanceDeck = deck;
            else state.chestDeck = deck;
        }

        const card = deck.shift();
        if (card.action !== 'GET_OUT_OF_JAIL_FREE') {
            discard.push(card);
        }

        const cardTypeName = (type === 'CHANCE') ? 'Khí Vận (Chance)' : 'Cơ Hội (Community Chest)';
        state.addLog(`<strong>${player.name}</strong> rút thẻ ${cardTypeName}: "${card.title}"`, 'warning', player.id);

        // Hiển thị Modal lật thẻ
        await this.showCardModal(card, type);

        // Thực thi hiệu lực của thẻ
        await this.executeCardAction(card, player, onTileActionNeeded);
    }

    showCardModal(card, type) {
        return new Promise(resolve => {
            if (!this.cardModalEl) this.init();

            const titleEl = document.getElementById('card-modal-title');
            const descEl = document.getElementById('card-modal-text');
            const typeHeaderEl = document.getElementById('card-modal-header-type');
            const iconEl = document.getElementById('card-modal-icon');
            const okBtn = document.getElementById('card-modal-ok-btn');

            const isChance = (type === 'CHANCE');
            if (typeHeaderEl) {
                typeHeaderEl.textContent = isChance ? 'THẺ KHÍ VẬN (CHANCE)' : 'THẺ CƠ HỘI (COMMUNITY CHEST)';
                typeHeaderEl.style.backgroundColor = isChance ? '#FF9800' : '#3B82F6';
            }
            if (titleEl) titleEl.textContent = card.title;
            if (descEl) descEl.textContent = card.text;
            if (iconEl) {
                iconEl.className = isChance ? 'fa-solid fa-question card-big-icon' : 'fa-solid fa-box-open card-big-icon';
                iconEl.style.color = isChance ? '#FF9800' : '#3B82F6';
            }

            if (this.cardModalEl) {
                this.cardModalEl.classList.add('active');
            }

            const activePlayer = state.getActivePlayer();
            // Nếu là lượt của AI và chế độ không phải xem chậm, tự động bấm OK sau 1.2s
            if (activePlayer.isAI) {
                let autoCloseDelay = (state.gameSpeed === 'instant') ? 100 : (state.gameSpeed === 'fast' ? 600 : 1300);
                setTimeout(() => {
                    if (this.cardModalEl && this.cardModalEl.classList.contains('active')) {
                        this.cardModalEl.classList.remove('active');
                        resolve();
                    }
                }, autoCloseDelay);
            } else {
                const handler = () => {
                    sound.playClick();
                    okBtn.removeEventListener('click', handler);
                    if (this.cardModalEl) this.cardModalEl.classList.remove('active');
                    resolve();
                };
                if (okBtn) okBtn.onclick = handler;
            }
        });
    }

    async executeCardAction(card, player, onTileActionNeeded) {
        switch (card.action) {
            case 'ADVANCE_TO': {
                const oldPos = player.position;
                const targetPos = card.tileId;
                // Kiểm tra có đi qua GO không
                if (targetPos < oldPos && targetPos !== 0) {
                    player.money += 200;
                    sound.playBuy();
                    state.addLog(`<strong>${player.name}</strong> đi qua ô Bắt Đầu (GO) và nhận $200!`, 'success', player.id);
                } else if (targetPos === 0) {
                    player.money += 200;
                    sound.playBuy();
                    state.addLog(`<strong>${player.name}</strong> về đích ô Bắt Đầu (GO) và nhận $200!`, 'success', player.id);
                }

                await board.animatePlayerMove(player.id, oldPos, targetPos, state.gameSpeed);
                if (onTileActionNeeded) {
                    await onTileActionNeeded(player, targetPos);
                }
                break;
            }

            case 'ADVANCE_TO_NEAREST_RR': {
                const oldPos = player.position;
                const rrIds = [5, 15, 25, 35];
                let targetPos = rrIds[0];
                for (const id of rrIds) {
                    if (id > oldPos) {
                        targetPos = id;
                        break;
                    }
                }
                if (targetPos < oldPos) {
                    player.money += 200;
                    sound.playBuy();
                    state.addLog(`<strong>${player.name}</strong> đi qua ô GO và nhận $200!`, 'success', player.id);
                }
                await board.animatePlayerMove(player.id, oldPos, targetPos, state.gameSpeed);
                if (onTileActionNeeded) {
                    await onTileActionNeeded(player, targetPos, { doubleRailroadRent: true });
                }
                break;
            }

            case 'ADVANCE_TO_NEAREST_UTILITY': {
                const oldPos = player.position;
                const utilIds = [12, 28];
                let targetPos = (oldPos > 12 && oldPos <= 28) ? 28 : 12;
                if (targetPos < oldPos) {
                    player.money += 200;
                    sound.playBuy();
                    state.addLog(`<strong>${player.name}</strong> đi qua ô GO và nhận $200!`, 'success', player.id);
                }
                await board.animatePlayerMove(player.id, oldPos, targetPos, state.gameSpeed);
                if (onTileActionNeeded) {
                    await onTileActionNeeded(player, targetPos, { tenTimesUtilityDice: true });
                }
                break;
            }

            case 'COLLECT_MONEY': {
                player.money += card.amount;
                sound.playBuy();
                state.addLog(`<strong>${player.name}</strong> nhận $${card.amount} từ Ngân Hàng.`, 'success', player.id);
                break;
            }

            case 'PAY_MONEY': {
                player.money -= card.amount;
                sound.playRent();
                state.addLog(`<strong>${player.name}</strong> phải nộp $${card.amount} cho Ngân Hàng.`, 'danger', player.id);
                break;
            }

            case 'COLLECT_FROM_EACH': {
                let totalCollected = 0;
                state.players.forEach(p => {
                    if (p.id !== player.id && !p.bankrupt) {
                        p.money -= card.amount;
                        totalCollected += card.amount;
                    }
                });
                player.money += totalCollected;
                sound.playBuy();
                state.addLog(`<strong>${player.name}</strong> nhận $${card.amount} từ mỗi người chơi (Tổng: +$${totalCollected}).`, 'success', player.id);
                break;
            }

            case 'PAY_EACH_PLAYER': {
                let totalPaid = 0;
                state.players.forEach(p => {
                    if (p.id !== player.id && !p.bankrupt) {
                        p.money += card.amount;
                        totalPaid += card.amount;
                    }
                });
                player.money -= totalPaid;
                sound.playRent();
                state.addLog(`<strong>${player.name}</strong> trả $${card.amount} cho mỗi người chơi (Tổng: -$${totalPaid}).`, 'danger', player.id);
                break;
            }

            case 'GO_TO_JAIL': {
                player.position = 10;
                player.inJail = true;
                player.jailTurns = 0;
                player.stats.timesInJail++;
                board.updatePlayerTokens();
                sound.playJail();
                state.addLog(`<strong>${player.name}</strong> bị tống thẳng vào Tù!`, 'danger', player.id);
                break;
            }

            case 'GET_OUT_OF_JAIL_FREE': {
                player.jailCards++;
                sound.playBuy();
                state.addLog(`<strong>${player.name}</strong> nhận được 1 Thẻ Ra Tù Miễn Phí!`, 'success', player.id);
                break;
            }

            case 'GO_BACK_SPACES': {
                const oldPos = player.position;
                const targetPos = (oldPos - card.spaces + 40) % 40;
                await board.animatePlayerMove(player.id, oldPos, targetPos, state.gameSpeed);
                if (onTileActionNeeded) {
                    await onTileActionNeeded(player, targetPos);
                }
                break;
            }

            case 'PROPERTY_REPAIRS': {
                const owned = state.getPlayerProperties(player.id);
                let houseCount = 0;
                let hotelCount = 0;
                owned.forEach(prop => {
                    if (prop.houses >= 1 && prop.houses <= 4) houseCount += prop.houses;
                    else if (prop.houses === 5) hotelCount += 1;
                });
                const totalCost = (houseCount * card.houseCost) + (hotelCount * card.hotelCost);
                player.money -= totalCost;
                sound.playRent();
                state.addLog(`<strong>${player.name}</strong> trả $${totalCost} phí sửa chữa (${houseCount} nhà, ${hotelCount} khách sạn).`, 'danger', player.id);
                break;
            }
        }
    }
}

export const cards = new CardManager();
