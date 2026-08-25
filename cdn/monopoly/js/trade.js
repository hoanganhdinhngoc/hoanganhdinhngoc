// js/trade.js
// Hệ thống Giao Dịch & Thương Lượng Đa Bên (Trade Hub)

import { state } from './state.js';
import { sound } from './audio.js';
import { board } from './board.js';
import { AIEvaluator } from './ai/aiEvaluator.js';

export class TradeManager {
    constructor() {
        this.tradeModalEl = null;
        this.senderId = 0;
        this.receiverId = 1;
        this.offeredCash = 0;
        this.requestedCash = 0;
        this.offeredPropertyIds = new Set();
        this.requestedPropertyIds = new Set();
    }

    init() {
        this.tradeModalEl = document.getElementById('trade-modal');
    }

    open(fromPlayerId = null) {
        if (!this.tradeModalEl) this.init();

        this.senderId = (fromPlayerId !== null) ? fromPlayerId : state.currentTurnPlayerId;
        
        // Chọn đối tác giao dịch mặc định là người chơi còn sống khác
        const otherPlayers = state.players.filter(p => p.id !== this.senderId && !p.bankrupt);
        if (otherPlayers.length === 0) {
            alert('Không còn người chơi nào khác để giao dịch!');
            return;
        }

        this.receiverId = otherPlayers[0].id;
        this.offeredCash = 0;
        this.requestedCash = 0;
        this.offeredPropertyIds.clear();
        this.requestedPropertyIds.clear();

        this.render();
        if (this.tradeModalEl) this.tradeModalEl.classList.add('active');
    }

    close() {
        if (this.tradeModalEl) this.tradeModalEl.classList.remove('active');
    }

    render() {
        const sender = state.getPlayer(this.senderId);
        const receiver = state.getPlayer(this.receiverId);
        if (!sender || !receiver) return;

        // Cập nhật Selector chọn đối tác
        const receiverSelectEl = document.getElementById('trade-receiver-select');
        if (receiverSelectEl) {
            receiverSelectEl.innerHTML = '';
            state.players.forEach(p => {
                if (p.id !== this.senderId && !p.bankrupt) {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = `${p.name} ${p.isAI ? `(AI - ${p.difficulty.toUpperCase()})` : '(Người)'} - $${p.money}`;
                    if (p.id === this.receiverId) opt.selected = true;
                    receiverSelectEl.appendChild(opt);
                }
            });

            receiverSelectEl.onchange = (e) => {
                this.receiverId = parseInt(e.target.value, 10);
                this.requestedCash = 0;
                this.requestedPropertyIds.clear();
                this.render();
            };
        }

        // Cập nhật thông tin Sender (Bên Đề Xuất)
        const senderNameEl = document.getElementById('trade-sender-name');
        const senderBalanceEl = document.getElementById('trade-sender-balance');
        const senderCashInput = document.getElementById('trade-sender-cash');
        const senderPropsList = document.getElementById('trade-sender-props');

        if (senderNameEl) senderNameEl.textContent = sender.name;
        if (senderBalanceEl) senderBalanceEl.textContent = `$${sender.money}`;
        if (senderCashInput) {
            senderCashInput.max = sender.money;
            senderCashInput.value = this.offeredCash;
            senderCashInput.oninput = (e) => {
                let val = parseInt(e.target.value, 10) || 0;
                if (val < 0) val = 0;
                if (val > sender.money) val = sender.money;
                this.offeredCash = val;
                e.target.value = val;
            };
        }

        if (senderPropsList) {
            senderPropsList.innerHTML = '';
            const senderOwned = state.getPlayerProperties(sender.id);
            // Chỉ cho phép giao dịch bất động sản không có nhà trên cả nhóm màu
            const tradableProps = senderOwned.filter(p => p.houses === 0);

            if (tradableProps.length === 0) {
                senderPropsList.innerHTML = '<div class="no-props">Không có tài sản hợp lệ để giao dịch</div>';
            } else {
                tradableProps.forEach(prop => {
                    const isSelected = this.offeredPropertyIds.has(prop.id);
                    const item = document.createElement('div');
                    item.className = `trade-prop-card ${isSelected ? 'selected' : ''}`;
                    item.innerHTML = `
                        <input type="checkbox" ${isSelected ? 'checked' : ''}>
                        <span class="prop-tag-dot" style="background-color: ${prop.color || '#4B5563'};"></span>
                        <span class="prop-title">${prop.name}</span>
                        <span class="prop-val">$${prop.price}</span>
                    `;
                    item.onclick = () => {
                        if (this.offeredPropertyIds.has(prop.id)) {
                            this.offeredPropertyIds.delete(prop.id);
                        } else {
                            this.offeredPropertyIds.add(prop.id);
                        }
                        this.render();
                    };
                    senderPropsList.appendChild(item);
                });
            }
        }

        // Cập nhật thông tin Receiver (Bên Nhận Đề Xuất)
        const receiverNameEl = document.getElementById('trade-receiver-name');
        const receiverBalanceEl = document.getElementById('trade-receiver-balance');
        const receiverCashInput = document.getElementById('trade-receiver-cash');
        const receiverPropsList = document.getElementById('trade-receiver-props');

        if (receiverNameEl) receiverNameEl.textContent = receiver.name;
        if (receiverBalanceEl) receiverBalanceEl.textContent = `$${receiver.money}`;
        if (receiverCashInput) {
            receiverCashInput.max = receiver.money;
            receiverCashInput.value = this.requestedCash;
            receiverCashInput.oninput = (e) => {
                let val = parseInt(e.target.value, 10) || 0;
                if (val < 0) val = 0;
                if (val > receiver.money) val = receiver.money;
                this.requestedCash = val;
                e.target.value = val;
            };
        }

        if (receiverPropsList) {
            receiverPropsList.innerHTML = '';
            const receiverOwned = state.getPlayerProperties(receiver.id);
            const tradableProps = receiverOwned.filter(p => p.houses === 0);

            if (tradableProps.length === 0) {
                receiverPropsList.innerHTML = '<div class="no-props">Không có tài sản hợp lệ để yêu cầu</div>';
            } else {
                tradableProps.forEach(prop => {
                    const isSelected = this.requestedPropertyIds.has(prop.id);
                    const item = document.createElement('div');
                    item.className = `trade-prop-card ${isSelected ? 'selected' : ''}`;
                    item.innerHTML = `
                        <input type="checkbox" ${isSelected ? 'checked' : ''}>
                        <span class="prop-tag-dot" style="background-color: ${prop.color || '#4B5563'};"></span>
                        <span class="prop-title">${prop.name}</span>
                        <span class="prop-val">$${prop.price}</span>
                    `;
                    item.onclick = () => {
                        if (this.requestedPropertyIds.has(prop.id)) {
                            this.requestedPropertyIds.delete(prop.id);
                        } else {
                            this.requestedPropertyIds.add(prop.id);
                        }
                        this.render();
                    };
                    receiverPropsList.appendChild(item);
                });
            }
        }

        // Nút gửi đề xuất
        const submitBtn = document.getElementById('trade-submit-btn');
        if (submitBtn) {
            submitBtn.onclick = () => this.submitTradeOffer();
        }
    }

    async submitTradeOffer() {
        const sender = state.getPlayer(this.senderId);
        const receiver = state.getPlayer(this.receiverId);
        if (!sender || !receiver) return;

        const offeredProps = Array.from(this.offeredPropertyIds);
        const requestedProps = Array.from(this.requestedPropertyIds);

        if (this.offeredCash === 0 && this.requestedCash === 0 && offeredProps.length === 0 && requestedProps.length === 0) {
            alert('Vui lòng chọn ít nhất một khoản tiền hoặc tài sản để trao đổi!');
            return;
        }

        this.close();

        state.addLog(`<strong>${sender.name}</strong> đã gửi một đề xuất giao dịch cho <strong>${receiver.name}</strong>.`, 'trade');

        if (receiver.isAI) {
            // Đánh giá phản hồi của AI
            const evaluation = AIEvaluator.evaluateTradeOffer(
                receiver.id,
                this.offeredCash,
                offeredProps,
                this.requestedCash,
                requestedProps,
                receiver.difficulty
            );

            if (evaluation.accept) {
                sound.playBuy();
                this.executeTrade(sender.id, receiver.id, this.offeredCash, offeredProps, this.requestedCash, requestedProps);
                state.addLog(`<strong>${receiver.name} (AI)</strong>: "${evaluation.reason}" - <strong>ĐÃ CHẤP NHẬN GIAO DỊCH!</strong>`, 'success');
                alert(`[${receiver.name} (AI)]:\n"Giao dịch đã được chấp nhận! Cảm ơn bạn."`);
            } else {
                sound.playRent();
                state.addLog(`<strong>${receiver.name} (AI)</strong>: "${evaluation.reason}" - <strong>ĐÃ TỪ CHỐI GIAO DỊCH!</strong>`, 'danger');
                alert(`[${receiver.name} (AI)]:\n"${evaluation.reason}"`);
            }
        } else {
            // Nếu người nhận là Người thật
            const offerSummary = `
                Người chơi ${sender.name} muốn giao dịch với bạn:
                - Bạn nhận được: $${this.offeredCash} và ${offeredProps.length} bất động sản
                - Bạn chuyển đi: $${this.requestedCash} và ${requestedProps.length} bất động sản
                Bạn có chấp thuận giao dịch này không?
            `;
            const confirmed = confirm(offerSummary);
            if (confirmed) {
                sound.playBuy();
                this.executeTrade(sender.id, receiver.id, this.offeredCash, offeredProps, this.requestedCash, requestedProps);
                state.addLog(`<strong>${receiver.name}</strong> đã chấp thuận đề xuất giao dịch!`, 'success');
            } else {
                state.addLog(`<strong>${receiver.name}</strong> đã từ chối đề xuất giao dịch.`, 'warning');
            }
        }

        window.dispatchEvent(new CustomEvent('monopoly:hud_update'));
    }

    executeTrade(p1Id, p2Id, p1Cash, p1Props, p2Cash, p2Props) {
        const p1 = state.getPlayer(p1Id);
        const p2 = state.getPlayer(p2Id);
        if (!p1 || !p2) return;

        // Chuyển tiền
        p1.money = p1.money - p1Cash + p2Cash;
        p2.money = p2.money - p2Cash + p1Cash;

        // Chuyển quyền sở hữu bất động sản
        p1Props.forEach(id => {
            if (state.properties[id]) {
                state.properties[id].ownerId = p2Id;
                board.updateTileOwnership(id);
            }
        });

        p2Props.forEach(id => {
            if (state.properties[id]) {
                state.properties[id].ownerId = p1Id;
                board.updateTileOwnership(id);
            }
        });

        board.updateAllTileOwnership();
        state.saveToStorage();
    }
}

export const trade = new TradeManager();
