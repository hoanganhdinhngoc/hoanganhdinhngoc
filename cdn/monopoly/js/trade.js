// js/trade.js
// Hệ thống Giao Dịch & Thương Lượng Đa Bên (Trade Hub) với Hộp Thoại Truyện Tranh Comic

import { state } from './state.js';
import { sound } from './audio.js';
import { board } from './board.js';
import { AIEvaluator } from './ai/aiEvaluator.js';
import { COLOR_GROUPS } from './data/boardData.js';

export class TradeManager {
    constructor() {
        this.tradeModalEl = null;
        this.comicBubbleEl = null;
        this.senderId = 0;
        this.receiverId = 1;
        this.offeredCash = 0;
        this.requestedCash = 0;
        this.offeredPropertyIds = new Set();
        this.requestedPropertyIds = new Set();
    }

    init() {
        this.tradeModalEl = document.getElementById('trade-modal');
        this.comicBubbleEl = document.getElementById('comic-trade-bubble-container');
    }

    open(fromPlayerId = null) {
        if (!this.tradeModalEl) this.init();

        this.senderId = (fromPlayerId !== null) ? fromPlayerId : state.currentTurnPlayerId;
        this.offeredCash = 0;
        this.requestedCash = 0;
        this.offeredPropertyIds.clear();
        this.requestedPropertyIds.clear();

        this.showSelectionScreen();
        if (this.tradeModalEl) this.tradeModalEl.classList.add('active');
    }

    close() {
        if (this.tradeModalEl) this.tradeModalEl.classList.remove('active');
    }

    showSelectionScreen() {
        const selScreen = document.getElementById('trade-player-selection-screen');
        const negScreen = document.getElementById('trade-negotiation-screen');
        const footer = document.getElementById('trade-modal-footer');
        
        selScreen.style.display = 'block';
        negScreen.style.display = 'none';
        footer.style.display = 'none';

        const listEl = document.getElementById('trade-partners-list');
        listEl.innerHTML = '';

        const otherPlayers = state.players.filter(p => p.id !== this.senderId && !p.bankrupt);
        if (otherPlayers.length === 0) {
            listEl.innerHTML = '<div style="color: #fff;">Không còn đối tác để giao dịch.</div>';
            return;
        }

        otherPlayers.forEach(p => {
            const props = state.getPlayerProperties(p.id);
            const btn = document.createElement('button');
            btn.className = 'trade-partner-btn';
            btn.innerHTML = `
                <div class="trade-partner-token" style="background-color: ${p.token.color}">
                    <i class="${p.token.icon}"></i>
                </div>
                <div class="trade-partner-info">
                    <div class="trade-partner-name">${p.name} ${p.isAI ? `(AI - ${p.difficulty.toUpperCase()})` : ''}</div>
                    <div class="trade-partner-stats">Ngân sách: <strong>$${p.money}</strong> • Sở hữu: <strong>${props.length} BĐS</strong></div>
                </div>
            `;
            btn.onclick = () => {
                sound.playClick();
                this.receiverId = p.id;
                this.requestedCash = 0;
                this.requestedPropertyIds.clear();
                this.showNegotiationScreen();
            };
            listEl.appendChild(btn);
        });
    }

    showNegotiationScreen() {
        const selScreen = document.getElementById('trade-player-selection-screen');
        const negScreen = document.getElementById('trade-negotiation-screen');
        const footer = document.getElementById('trade-modal-footer');
        
        selScreen.style.display = 'none';
        negScreen.style.display = 'block';
        footer.style.display = 'flex';

        const backBtn = document.getElementById('trade-back-to-selection');
        if (backBtn) {
            backBtn.onclick = () => {
                sound.playClick();
                this.showSelectionScreen();
            };
        }

        this.bindCashAdjustButtons();
        this.renderNegotiation();
    }

    bindCashAdjustButtons() {
        const adjustBtns = document.querySelectorAll('.btn-cash-adjust');
        adjustBtns.forEach(btn => {
            btn.onclick = (e) => {
                const target = e.currentTarget.getAttribute('data-target');
                const sign = parseInt(e.currentTarget.getAttribute('data-sign'), 10);
                const step = parseInt(document.getElementById('trade-cash-step').value, 10);
                const sender = state.getPlayer(this.senderId);
                const receiver = state.getPlayer(this.receiverId);
                
                if (target === 'sender') {
                    let newVal = this.offeredCash + (sign * step);
                    if (newVal < 0) newVal = 0;
                    if (newVal > sender.money) newVal = sender.money;
                    this.offeredCash = newVal;
                } else if (target === 'receiver') {
                    let newVal = this.requestedCash + (sign * step);
                    if (newVal < 0) newVal = 0;
                    if (newVal > receiver.money) newVal = receiver.money;
                    this.requestedCash = newVal;
                }
                this.renderNegotiation();
            };
        });
        
        // Also bind the direct input change
        const senderInput = document.getElementById('trade-sender-cash');
        if (senderInput) {
            senderInput.oninput = (e) => {
                const sender = state.getPlayer(this.senderId);
                let val = parseInt(e.target.value, 10) || 0;
                if (val < 0) val = 0;
                if (val > sender.money) val = sender.money;
                this.offeredCash = val;
                e.target.value = val;
            };
        }
        const receiverInput = document.getElementById('trade-receiver-cash');
        if (receiverInput) {
            receiverInput.oninput = (e) => {
                const receiver = state.getPlayer(this.receiverId);
                let val = parseInt(e.target.value, 10) || 0;
                if (val < 0) val = 0;
                if (val > receiver.money) val = receiver.money;
                this.requestedCash = val;
                e.target.value = val;
            };
        }
    }

    renderNegotiation() {
        const sender = state.getPlayer(this.senderId);
        const receiver = state.getPlayer(this.receiverId);
        if (!sender || !receiver) return;

        document.getElementById('trade-sender-name').textContent = sender.name;
        document.getElementById('trade-sender-balance').textContent = `$${sender.money}`;
        document.getElementById('trade-sender-cash').value = this.offeredCash;

        document.getElementById('trade-receiver-name').textContent = receiver.name;
        document.getElementById('trade-receiver-balance').textContent = `$${receiver.money}`;
        document.getElementById('trade-receiver-cash').value = this.requestedCash;

        this.renderPropsList(sender, 'trade-sender-props', this.offeredPropertyIds);
        this.renderPropsList(receiver, 'trade-receiver-props', this.requestedPropertyIds);

        const submitBtn = document.getElementById('trade-submit-btn');
        if (submitBtn) submitBtn.onclick = () => this.submitTradeOffer();
    }

    renderPropsList(player, containerId, selectedSet) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        
        const owned = state.getPlayerProperties(player.id);
        const tradableProps = owned.filter(p => p.houses === 0);

        if (tradableProps.length === 0) {
            container.innerHTML = '<div class="no-props" style="padding: 10px; font-size: 12px; color: var(--text-muted); text-align: center;">Không có tài sản hợp lệ</div>';
            return;
        }

        tradableProps.forEach(prop => {
            const isSelected = selectedSet.has(prop.id);
            const item = document.createElement('div');
            item.className = `trade-prop-item ${isSelected ? 'selected' : ''}`;
            const groupInfo = COLOR_GROUPS ? COLOR_GROUPS[prop.group] : null;
            if (groupInfo && prop.group !== 'railroad' && prop.group !== 'utility') {
                item.classList.add('has-color');
                item.style.borderLeftColor = groupInfo.hex;
            }
            
            item.innerHTML = `
                <input type="checkbox" ${isSelected ? 'checked' : ''} style="margin-right: 10px;">
                <div style="flex: 1; font-size: 13px;">${prop.name}</div>
                <div style="font-weight: 700; color: #10B981;">$${prop.price}</div>
            `;
            item.onclick = () => {
                if (selectedSet.has(prop.id)) {
                    selectedSet.delete(prop.id);
                } else {
                    selectedSet.add(prop.id);
                }
                this.renderNegotiation();
            };
            container.appendChild(item);
        });
    }

    async submitTradeOffer() {
        const sender = state.getPlayer(this.senderId);
        const receiver = state.getPlayer(this.receiverId);
        if (!sender || !receiver) return;

        const offeredProps = Array.from(this.offeredPropertyIds);
        const requestedProps = Array.from(this.requestedPropertyIds);

        if (this.offeredCash === 0 && this.requestedCash === 0 && offeredProps.length === 0 && requestedProps.length === 0) {
            this.showComicMessage(sender, 'Bạn phải chọn ít nhất một khoản tiền hoặc bất động sản để trao đổi!', 'warning');
            return;
        }

        this.close();

        state.addLog(`<strong>${sender.name}</strong> đã gửi đề xuất giao dịch cho <strong>${receiver.name}</strong>.`, 'trade');

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
                await this.showComicMessage(receiver, `Thỏa thuận tuyệt vời! Tôi đồng ý giao dịch này. Cảm ơn bạn!`, 'success');
            } else {
                sound.playRent();
                state.addLog(`<strong>${receiver.name} (AI)</strong>: "${evaluation.reason}" - <strong>ĐÃ TỪ CHỐI GIAO DỊCH!</strong>`, 'danger');
                await this.showComicMessage(receiver, `${evaluation.reason}`, 'danger', () => {
                    this.tradeModalEl.classList.add('active');
                    this.showNegotiationScreen();
                });
            }
        } else {
            // Người nhận là Người thật -> Hiển thị Comic Speech Bubble để xác nhận
            const accepted = await this.promptComicTradeConfirmation(sender, receiver, this.offeredCash, offeredProps, this.requestedCash, requestedProps);
            if (accepted) {
                sound.playBuy();
                this.executeTrade(sender.id, receiver.id, this.offeredCash, offeredProps, this.requestedCash, requestedProps);
                state.addLog(`<strong>${receiver.name}</strong> đã chấp thuận đề xuất giao dịch!`, 'success');
            } else {
                state.addLog(`<strong>${receiver.name}</strong> đã từ chối đề xuất giao dịch.`, 'warning');
            }
        }

        window.dispatchEvent(new CustomEvent('monopoly:hud_update'));
    }

    // Hiển thị Comic Speech Bubble xác nhận giao dịch cho người chơi
    promptComicTradeConfirmation(sender, receiver, offeredCash, offeredPropIds, requestedCash, requestedPropIds) {
        return new Promise(resolve => {
            if (!this.comicBubbleEl) this.init();

            const avatarCircle = document.getElementById('comic-avatar-circle');
            const avatarName = document.getElementById('comic-avatar-name');
            const titleEl = document.getElementById('comic-speech-title');
            const detailsEl = document.getElementById('comic-trade-details');
            const btnRow = document.getElementById('comic-btn-row');

            if (avatarCircle) {
                avatarCircle.style.backgroundColor = sender.token.color;
                avatarCircle.innerHTML = `<i class="${sender.token.icon}"></i>`;
            }
            if (avatarName) avatarName.textContent = sender.name;
            if (titleEl) titleEl.textContent = 'ĐỀ XUẤT GIAO DỊCH';

            const offeredPropNames = offeredPropIds.map(id => state.getTile(id).name).join(', ') || 'Không có';
            const requestedPropNames = requestedPropIds.map(id => state.getTile(id).name).join(', ') || 'Không có';

            if (detailsEl) {
                detailsEl.innerHTML = `
                    <div class="comic-trade-section">
                        <strong>👉 Bạn sẽ nhận được:</strong><br>
                        • Tiền mặt: <span style="color: #10B981; font-weight: 800;">+$${offeredCash}</span><br>
                        • BĐS: ${offeredPropNames}
                    </div>
                    <div class="comic-trade-section">
                        <strong>👈 Bạn sẽ chuyển đi:</strong><br>
                        • Tiền mặt: <span style="color: #EF4444; font-weight: 800;">-$${requestedCash}</span><br>
                        • BĐS: ${requestedPropNames}
                    </div>
                `;
            }

            if (btnRow) {
                btnRow.innerHTML = `
                    <button id="comic-btn-decline" class="comic-btn comic-btn-decline"><i class="fa-solid fa-xmark"></i> Từ Chối</button>
                    <button id="comic-btn-accept" class="comic-btn comic-btn-accept"><i class="fa-solid fa-check"></i> Chấp Nhận</button>
                `;

                document.getElementById('comic-btn-accept').onclick = () => {
                    sound.playClick();
                    this.comicBubbleEl.classList.remove('active');
                    resolve(true);
                };

                document.getElementById('comic-btn-decline').onclick = () => {
                    sound.playClick();
                    this.comicBubbleEl.classList.remove('active');
                    resolve(false);
                };
            }

            this.comicBubbleEl.classList.add('active');
        });
    }

    // Hiển thị Comic Speech Bubble thông điệp của nhân vật
    showComicMessage(player, messageText, type = 'info', onRetry = null) {
        return new Promise(resolve => {
            if (!this.comicBubbleEl) this.init();

            const avatarCircle = document.getElementById('comic-avatar-circle');
            const avatarName = document.getElementById('comic-avatar-name');
            const titleEl = document.getElementById('comic-speech-title');
            const detailsEl = document.getElementById('comic-trade-details');
            const btnRow = document.getElementById('comic-btn-row');

            if (avatarCircle) {
                avatarCircle.style.backgroundColor = player.token.color;
                avatarCircle.innerHTML = `<i class="${player.token.icon}"></i>`;
            }
            if (avatarName) avatarName.textContent = player.name;
            if (titleEl) {
                titleEl.textContent = (type === 'success') ? 'ĐỒNG Ý GIAO DỊCH' : (type === 'danger' ? 'TỪ CHỐI GIAO DỊCH' : 'THÔNG BÁO');
            }

            if (detailsEl) {
                detailsEl.innerHTML = `<p style="font-size: 15px; font-weight: 600; line-height: 1.5;">"${messageText}"</p>`;
            }

            if (btnRow) {
                let btnsHtml = `<button id="comic-btn-ok" class="comic-btn comic-btn-ok">Đã Hiểu</button>`;
                if (onRetry) {
                    btnsHtml = `<button id="comic-btn-retry" class="comic-btn comic-btn-ok" style="background-color: #3B82F6; color: white;">Đề xuất deal khác</button>` + btnsHtml;
                }
                btnRow.innerHTML = btnsHtml;
                
                document.getElementById('comic-btn-ok').onclick = () => {
                    sound.playClick();
                    this.comicBubbleEl.classList.remove('active');
                    resolve(false);
                };
                
                if (onRetry) {
                    document.getElementById('comic-btn-retry').onclick = () => {
                        sound.playClick();
                        this.comicBubbleEl.classList.remove('active');
                        onRetry();
                        resolve(true);
                    };
                }
            }

            this.comicBubbleEl.classList.add('active');
        });
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
