// js/game.js
// Vòng Lặp Trò Chơi Cốt Lõi (Core Game Loop & Controller)

import { state } from './state.js';
import { sound } from './audio.js';
import { board } from './board.js';
import { dice } from './dice.js';
import { cards } from './cards.js';
import { manage } from './manage.js';
import { trade } from './trade.js';
import { aiController } from './ai/aiController.js';
import { AIDifficulty } from './ai/aiDifficulty.js';
import { COLOR_GROUPS } from './data/boardData.js';

export class GameEngine {
    constructor() {
        this.isProcessing = false;
        this.actionButtons = {};
    }

    init() {
        this.cacheDOMElements();
        this.bindEvents();
        board.init('monopoly-board', (tileId) => this.showTileDetailsModal(tileId));
        this.updateHUD();
    }

    cacheDOMElements() {
        this.actionButtons = {
            rollBtn: document.getElementById('btn-roll-dice'),
            manageBtn: document.getElementById('btn-manage-props'),
            tradeBtn: document.getElementById('btn-open-trade'),
            endTurnBtn: document.getElementById('btn-end-turn'),
            leaveJailBtn: document.getElementById('btn-leave-jail')
        };
    }

    bindEvents() {
        if (this.actionButtons.rollBtn) {
            this.actionButtons.rollBtn.onclick = () => this.handleHumanRoll();
        }
        if (this.actionButtons.manageBtn) {
            this.actionButtons.manageBtn.onclick = () => manage.open();
        }
        if (this.actionButtons.tradeBtn) {
            this.actionButtons.tradeBtn.onclick = () => trade.open();
        }
        if (this.actionButtons.endTurnBtn) {
            this.actionButtons.endTurnBtn.onclick = () => this.endTurn();
        }
        if (this.actionButtons.leaveJailBtn) {
            this.actionButtons.leaveJailBtn.onclick = () => this.handleHumanLeaveJail();
        }

        window.addEventListener('monopoly:hud_update', () => this.updateHUD());
    }

    // Bắt đầu game mới
    startGame(playerConfigs) {
        state.reset();
        state.initPlayers(playerConfigs);
        board.renderTiles();
        board.updatePlayerTokens();
        this.updateHUD();
        this.checkTurnStart();
    }

    // Tiếp tục game từ LocalStorage
    resumeGame() {
        const success = state.loadFromStorage();
        if (success) {
            board.renderTiles();
            board.updatePlayerTokens();
            board.updateAllTileOwnership();
            this.updateHUD();
            this.checkTurnStart();
            state.addLog('Đã khôi phục trò chơi từ lần lưu trước!', 'success');
            return true;
        }
        return false;
    }

    // Bắt đầu một lượt đi
    checkTurnStart() {
        const winner = state.getWinner();
        if (winner) {
            this.showVictoryModal(winner);
            return;
        }

        const activePlayer = state.getActivePlayer();
        if (!activePlayer || activePlayer.bankrupt) {
            this.endTurn();
            return;
        }

        this.updateHUD();
        this.updateControlsState();

        if (activePlayer.isAI) {
            // Lượt của AI
            setTimeout(() => {
                aiController.executeTurn(this);
            }, state.gameSpeed === 'instant' ? 50 : 500);
        }
    }

    // Xử lý Người chơi bấm nút Đổ xúc xắc
    async handleHumanRoll() {
        const player = state.getActivePlayer();
        if (!player || player.isAI || this.isProcessing) return;

        this.isProcessing = true;
        this.disableControls();

        // 1. Đổ xúc xắc
        const rollResult = await dice.roll(state.gameSpeed);
        state.diceState = rollResult;

        const diceTextEl = document.getElementById('dice-result-text');
        if (diceTextEl) {
            diceTextEl.textContent = `Bạn đổ được: ${rollResult.die1} + ${rollResult.die2} = ${rollResult.total} ${rollResult.isDouble ? '(ĐÔI!)' : ''}`;
        }

        // Xử lý trong tù
        if (player.inJail) {
            if (rollResult.isDouble) {
                player.inJail = false;
                player.jailTurns = 0;
                sound.playUnjail();
                state.addLog(`<strong>${player.name}</strong> đổ được xúc xắc ĐÔI (${rollResult.die1}-${rollResult.die2}) và thoát khỏi Tù!`, 'success', player.id);
            } else {
                player.jailTurns++;
                if (player.jailTurns >= 3) {
                    player.money -= 50;
                    player.inJail = false;
                    player.jailTurns = 0;
                    sound.playUnjail();
                    state.addLog(`<strong>${player.name}</strong> đã ở tù 3 lượt, phải nộp phạt $50 và được đi tiếp.`, 'warning', player.id);
                } else {
                    state.addLog(`<strong>${player.name}</strong> không đổ được đôi (Lần ${player.jailTurns}/3) và tiếp tục ở lại trong Tù.`, 'info', player.id);
                    this.isProcessing = false;
                    state.turnPhase = 'MANAGE_OR_END';
                    this.updateControlsState();
                    return;
                }
            }
        }

        // Kiểm tra luật 3 lần đổ đôi
        if (rollResult.isDouble) {
            state.doublesRolledCount++;
            if (state.doublesRolledCount >= 3) {
                state.addLog(`<strong>${player.name}</strong> đổ đôi 3 lần liên tiếp và bị bắt vào Tù!`, 'danger', player.id);
                player.position = 10;
                player.inJail = true;
                player.jailTurns = 0;
                player.stats.timesInJail++;
                board.updatePlayerTokens();
                sound.playJail();
                this.isProcessing = false;
                this.endTurn();
                return;
            }
        } else {
            state.doublesRolledCount = 0;
        }

        // 2. Di chuyển token
        const oldPos = player.position;
        const newPos = (oldPos + rollResult.total) % 40;

        if (newPos < oldPos) {
            player.money += 200;
            sound.playBuy();
            state.addLog(`<strong>${player.name}</strong> đi qua ô Bắt Đầu (GO) và nhận $200!`, 'success', player.id);
        }

        await board.animatePlayerMove(player.id, oldPos, newPos, state.gameSpeed);

        // 3. Xử lý ô đáp xuống
        await this.handleTileLanding(player, newPos);

        this.isProcessing = false;

        // Nếu đổ đôi và chưa bị vào tù -> Được tung tiếp
        if (rollResult.isDouble && !player.inJail && !player.bankrupt) {
            state.turnPhase = 'ROLL';
            state.addLog(`<strong>${player.name}</strong> đổ được đôi nên được quyền tung xúc xắc tiếp!`, 'info', player.id);
        } else {
            state.turnPhase = 'MANAGE_OR_END';
        }

        this.updateControlsState();
        this.updateHUD();
    }

    // Xử lý nộp phạt hoặc dùng thẻ để ra tù ngay
    handleHumanLeaveJail() {
        const player = state.getActivePlayer();
        if (!player || !player.inJail) return;

        if (player.jailCards > 0) {
            player.jailCards--;
            player.inJail = false;
            player.jailTurns = 0;
            sound.playUnjail();
            state.addLog(`<strong>${player.name}</strong> đã sử dụng Thẻ Ra Tù Miễn Phí.`, 'success', player.id);
        } else if (player.money >= 50) {
            player.money -= 50;
            player.inJail = false;
            player.jailTurns = 0;
            sound.playUnjail();
            state.addLog(`<strong>${player.name}</strong> đã nộp $50 tiền bảo lãnh để ra tù.`, 'warning', player.id);
        } else {
            alert('Bạn không đủ $50 tiền mặt để ra tù!');
            return;
        }

        this.updateControlsState();
        this.updateHUD();
    }

    // Xử lý toàn diện ô vừa đáp xuống
    async handleTileLanding(player, tileId, options = {}) {
        const tile = state.getTile(tileId);
        if (!tile) return;

        state.addLog(`<strong>${player.name}</strong> đáp xuống ô <strong>${tile.name}</strong>.`, 'info', player.id);

        switch (tile.type) {
            case 'PROPERTY':
            case 'RAILROAD':
            case 'UTILITY': {
                const prop = state.properties[tileId];
                if (prop.ownerId === null) {
                    // Ô chưa có chủ -> Hỏi mua hoặc AI quyết định mua
                    await this.handleUnownedProperty(player, tile);
                } else if (prop.ownerId === player.id) {
                    state.addLog(`<strong>${player.name}</strong> đang đứng trên bất động sản của chính mình.`, 'info', player.id);
                } else {
                    // Ô thuộc về người khác -> Trả tiền thuê
                    await this.handlePayRent(player, tile, prop, options);
                }
                break;
            }

            case 'TAX': {
                sound.playRent();
                state.addLog(`<strong>${player.name}</strong> phải nộp thuế $${tile.taxAmount} cho Ngân Hàng.`, 'danger', player.id);
                await this.deductMoneyOrHandleDebt(player, tile.taxAmount, null);
                break;
            }

            case 'CHANCE': {
                await cards.drawCard('CHANCE', player.id, (p, tPos, opt) => this.handleTileLanding(p, tPos, opt));
                break;
            }

            case 'CHEST': {
                await cards.drawCard('CHEST', player.id, (p, tPos, opt) => this.handleTileLanding(p, tPos, opt));
                break;
            }

            case 'GO_TO_JAIL': {
                player.position = 10;
                player.inJail = true;
                player.jailTurns = 0;
                player.stats.timesInJail++;
                board.updatePlayerTokens();
                sound.playJail();
                state.addLog(`<strong>${player.name}</strong> bị cảnh sát bắt và giải thẳng vào Tù!`, 'danger', player.id);
                break;
            }

            case 'GO':
            case 'JAIL':
            case 'PARKING':
                // Không có phí phạt đặc biệt
                break;
        }

        this.updateHUD();
    }

    // Xử lý ô đất chưa có chủ
    async handleUnownedProperty(player, tile) {
        if (player.isAI) {
            // Quyết định mua của AI
            const shouldBuy = AIDifficulty.shouldBuyProperty(player, tile);
            if (shouldBuy && player.money >= tile.price) {
                this.buyProperty(player.id, tile.id);
            } else {
                state.addLog(`<strong>${player.name} (AI)</strong> quyết định không mua ô <strong>${tile.name}</strong>.`, 'info', player.id);
            }
        } else {
            // Người chơi thật: Mở popup xác nhận mua
            await this.promptHumanBuyProperty(player, tile);
        }
    }

    promptHumanBuyProperty(player, tile) {
        return new Promise(resolve => {
            const buyModalEl = document.getElementById('buy-property-modal');
            const propNameEl = document.getElementById('buy-modal-prop-name');
            const propPriceEl = document.getElementById('buy-modal-prop-price');
            const propGroupEl = document.getElementById('buy-modal-prop-group');
            const buyBtn = document.getElementById('buy-modal-btn-confirm');
            const passBtn = document.getElementById('buy-modal-btn-pass');

            const groupInfo = COLOR_GROUPS[tile.group] || { name: tile.group, hex: '#4B5563' };

            if (propNameEl) propNameEl.textContent = tile.name;
            if (propPriceEl) propPriceEl.textContent = `$${tile.price}`;
            if (propGroupEl) {
                propGroupEl.textContent = groupInfo.name;
                propGroupEl.style.backgroundColor = groupInfo.hex;
            }

            if (buyBtn) {
                buyBtn.disabled = (player.money < tile.price);
                buyBtn.onclick = () => {
                    sound.playClick();
                    if (buyModalEl) buyModalEl.classList.remove('active');
                    this.buyProperty(player.id, tile.id);
                    resolve();
                };
            }

            if (passBtn) {
                passBtn.onclick = () => {
                    sound.playClick();
                    if (buyModalEl) buyModalEl.classList.remove('active');
                    state.addLog(`<strong>${player.name}</strong> bỏ qua cơ hội mua <strong>${tile.name}</strong>.`, 'info', player.id);
                    resolve();
                };
            }

            if (buyModalEl) buyModalEl.classList.add('active');
        });
    }

    buyProperty(playerId, tileId) {
        const player = state.getPlayer(playerId);
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];

        if (!player || !tile || !prop || player.money < tile.price) return false;

        player.money -= tile.price;
        prop.ownerId = playerId;
        player.stats.propertiesBought++;
        sound.playBuy();

        state.addLog(`<strong>${player.name}</strong> đã mua <strong>${tile.name}</strong> với giá $${tile.price}!`, 'success', player.id);
        board.updateTileOwnership(tileId);
        return true;
    }

    // Xử lý trả tiền thuê
    async handlePayRent(player, tile, prop, options = {}) {
        const owner = state.getPlayer(prop.ownerId);
        if (!owner || owner.bankrupt) return;

        if (prop.isMortgaged) {
            state.addLog(`<strong>${tile.name}</strong> đang bị thế chấp nên <strong>${player.name}</strong> không phải trả tiền thuê.`, 'info', player.id);
            return;
        }

        let rentAmount = state.calculateRent(tile.id, state.diceState.total);
        if (options.doubleRailroadRent) rentAmount *= 2;
        if (options.tenTimesUtilityDice) rentAmount = (state.diceState.total || 7) * 10;

        sound.playRent();
        state.addLog(`<strong>${player.name}</strong> phải trả $${rentAmount} tiền thuê cho <strong>${owner.name}</strong> khi vào <strong>${tile.name}</strong>.`, 'danger', player.id);

        await this.deductMoneyOrHandleDebt(player, rentAmount, owner);
    }

    // Trừ tiền hoặc xử lý vỡ nợ (Debt / Bankruptcy)
    async deductMoneyOrHandleDebt(debtor, amount, creditor = null) {
        if (debtor.money >= amount) {
            debtor.money -= amount;
            if (creditor) creditor.money += amount;
            debtor.stats.rentPaid += amount;
            if (creditor) creditor.stats.rentReceived += amount;
            return true;
        }

        // Thiếu tiền mặt -> Kiểm tra tổng tài sản ròng
        const netWorth = state.calculateNetWorth(debtor.id);

        if (netWorth < amount) {
            // Phá sản hoàn toàn!
            this.declareBankruptcy(debtor, creditor);
            return false;
        }

        // Có thể cứu vãn bằng cách thế chấp hoặc bán nhà
        if (debtor.isAI) {
            // AI tự động thế chấp tài sản để trả nợ
            this.autoLiquidateForAI(debtor, amount);
            if (debtor.money >= amount) {
                debtor.money -= amount;
                if (creditor) creditor.money += amount;
                return true;
            } else {
                this.declareBankruptcy(debtor, creditor);
                return false;
            }
        } else {
            // Người chơi thật: Bắt buộc mở modal Quản lý tài sản để huy động vốn
            alert(`CẢNH BÁO NỢ: Bạn cần $${amount} nhưng chỉ có $${debtor.money}. Vui lòng bán nhà hoặc thế chấp tài sản để đủ tiền thanh toán!`);
            manage.open(debtor.id);
            // Người chơi sẽ phải tự xoay xở và đóng modal
            return true;
        }
    }

    // AI tự động giải cứu dòng tiền khi bị thiếu nợ
    autoLiquidateForAI(player, requiredAmount) {
        const owned = state.getPlayerProperties(player.id);

        // 1. Bán nhà trước
        for (const prop of owned) {
            while (prop.houses > 0 && player.money < requiredAmount) {
                manage.sellHouse(player.id, prop.id);
            }
        }

        // 2. Thế chấp bất động sản nếu vẫn thiếu tiền
        for (const prop of owned) {
            if (!prop.isMortgaged && player.money < requiredAmount) {
                manage.mortgageProperty(player.id, prop.id);
            }
        }
    }

    // Xử lý tuyên bố Phá sản
    declareBankruptcy(debtor, creditor = null) {
        debtor.bankrupt = true;
        debtor.money = 0;
        sound.playBankruptcy();

        if (creditor) {
            state.addLog(`🚨 <strong>${debtor.name}</strong> đã PHÁ SẢN trước <strong>${creditor.name}</strong>! Toàn bộ tài sản được chuyển giao cho ${creditor.name}.`, 'danger', debtor.id);
            // Chuyển toàn bộ tài sản cho chủ nợ
            for (const [tileIdStr, prop] of Object.entries(state.properties)) {
                if (prop.ownerId === debtor.id) {
                    prop.ownerId = creditor.id;
                }
            }
            creditor.jailCards += debtor.jailCards;
            debtor.jailCards = 0;
        } else {
            state.addLog(`🚨 <strong>${debtor.name}</strong> đã PHÁ SẢN trước Ngân Hàng! Toàn bộ tài sản được trả về cho Ngân Hàng.`, 'danger', debtor.id);
            // Trả toàn bộ tài sản về Ngân hàng (reset về đất trống)
            for (const [tileIdStr, prop] of Object.entries(state.properties)) {
                if (prop.ownerId === debtor.id) {
                    prop.ownerId = null;
                    prop.houses = 0;
                    prop.isMortgaged = false;
                }
            }
        }

        board.updatePlayerTokens();
        board.updateAllTileOwnership();
        this.updateHUD();

        const winner = state.getWinner();
        if (winner) {
            this.showVictoryModal(winner);
        }
    }

    // Kết thúc lượt đi hiện tại
    endTurn() {
        if (state.turnPhase === 'GAME_OVER') return;
        state.nextTurn();
        this.checkTurnStart();
    }

    // Cập nhật trạng thái hiển thị của các nút điều khiển
    updateControlsState() {
        const active = state.getActivePlayer();
        const isHumanTurn = active && !active.isAI && !active.bankrupt;

        if (!isHumanTurn) {
            this.disableControls();
            return;
        }

        if (state.turnPhase === 'ROLL') {
            if (this.actionButtons.rollBtn) this.actionButtons.rollBtn.disabled = false;
            if (this.actionButtons.manageBtn) this.actionButtons.manageBtn.disabled = false;
            if (this.actionButtons.tradeBtn) this.actionButtons.tradeBtn.disabled = false;
            if (this.actionButtons.endTurnBtn) this.actionButtons.endTurnBtn.disabled = true;
            if (this.actionButtons.leaveJailBtn) {
                this.actionButtons.leaveJailBtn.style.display = active.inJail ? 'inline-flex' : 'none';
                this.actionButtons.leaveJailBtn.disabled = false;
            }
        } else if (state.turnPhase === 'MANAGE_OR_END') {
            if (this.actionButtons.rollBtn) this.actionButtons.rollBtn.disabled = true;
            if (this.actionButtons.manageBtn) this.actionButtons.manageBtn.disabled = false;
            if (this.actionButtons.tradeBtn) this.actionButtons.tradeBtn.disabled = false;
            if (this.actionButtons.endTurnBtn) this.actionButtons.endTurnBtn.disabled = false;
            if (this.actionButtons.leaveJailBtn) this.actionButtons.leaveJailBtn.style.display = 'none';
        }
    }

    disableControls() {
        if (this.actionButtons.rollBtn) this.actionButtons.rollBtn.disabled = true;
        if (this.actionButtons.manageBtn) this.actionButtons.manageBtn.disabled = true;
        if (this.actionButtons.tradeBtn) this.actionButtons.tradeBtn.disabled = true;
        if (this.actionButtons.endTurnBtn) this.actionButtons.endTurnBtn.disabled = true;
        if (this.actionButtons.leaveJailBtn) this.actionButtons.leaveJailBtn.disabled = true;
    }

    // Cập nhật giao diện HUD danh sách người chơi
    updateHUD() {
        const hudListEl = document.getElementById('players-hud-list');
        if (!hudListEl) return;
        hudListEl.innerHTML = '';

        state.players.forEach(player => {
            const card = document.createElement('div');
            const isActive = (state.currentTurnPlayerId === player.id && !player.bankrupt);
            card.className = `player-hud-card ${isActive ? 'active-turn' : ''} ${player.bankrupt ? 'bankrupt' : ''}`;
            card.style.borderLeftColor = player.token.color;

            const owned = state.getPlayerProperties(player.id);
            const netWorth = state.calculateNetWorth(player.id);

            card.innerHTML = `
                <div class="hud-card-top">
                    <div class="hud-player-name">
                        <span class="hud-token-icon" style="background-color: ${player.token.color};">
                            <i class="${player.token.icon}"></i>
                        </span>
                        <span class="name-text">${player.name}</span>
                        ${player.isAI ? `<span class="ai-badge diff-${player.difficulty}">${player.difficulty.toUpperCase()}</span>` : '<span class="human-badge">BẠN</span>'}
                    </div>
                    ${player.bankrupt ? '<span class="bankrupt-tag">PHÁ SẢN</span>' : `<div class="hud-money">$${player.money}</div>`}
                </div>
                ${!player.bankrupt ? `
                    <div class="hud-card-bottom">
                        <span class="hud-stat"><i class="fa-solid fa-building"></i> ${owned.length} BĐS</span>
                        <span class="hud-stat"><i class="fa-solid fa-chart-line"></i> $${netWorth} Net</span>
                        ${player.inJail ? '<span class="hud-jail-badge"><i class="fa-solid fa-lock"></i> Tù</span>' : ''}
                        ${player.jailCards > 0 ? `<span class="hud-jail-card-badge" title="${player.jailCards} Thẻ ra tù"><i class="fa-solid fa-id-card"></i> ${player.jailCards}</span>` : ''}
                    </div>
                ` : ''}
            `;

            hudListEl.appendChild(card);
        });

        // Cập nhật vị trí token trên bàn cờ
        board.updatePlayerTokens();
    }

    // Hiển thị chi tiết ô cờ khi bấm vào
    showTileDetailsModal(tileId) {
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];
        const modalEl = document.getElementById('deed-modal');
        if (!tile || !modalEl) return;

        const titleEl = document.getElementById('deed-modal-title');
        const headerEl = document.getElementById('deed-modal-header');
        const contentEl = document.getElementById('deed-modal-content');
        const closeBtn = document.getElementById('deed-modal-close-btn');

        const groupInfo = COLOR_GROUPS[tile.group] || { hex: '#4B5563', name: tile.group };

        if (titleEl) titleEl.textContent = tile.name;
        if (headerEl) headerEl.style.backgroundColor = groupInfo.hex;

        let ownerText = 'Chưa có chủ (Ngân Hàng)';
        if (prop && prop.ownerId !== null) {
            const owner = state.getPlayer(prop.ownerId);
            ownerText = `<strong>${owner.name}</strong> ${prop.isMortgaged ? '(ĐANG THẾ CHẤP)' : ''}`;
        }

        let bodyHTML = '';
        if (tile.type === 'PROPERTY') {
            bodyHTML = `
                <div class="deed-rent-table">
                    <div class="rent-row"><span>Tiền thuê đất:</span> <strong>$${tile.rent[0]}</strong></div>
                    <div class="rent-row"><span>Thuê trọn bộ nhóm màu:</span> <strong>$${tile.rent[0] * 2}</strong></div>
                    <div class="rent-row"><span>Với 1 Căn Nhà:</span> <strong>$${tile.rent[1]}</strong></div>
                    <div class="rent-row"><span>Với 2 Căn Nhà:</span> <strong>$${tile.rent[2]}</strong></div>
                    <div class="rent-row"><span>Với 3 Căn Nhà:</span> <strong>$${tile.rent[3]}</strong></div>
                    <div class="rent-row"><span>Với 4 Căn Nhà:</span> <strong>$${tile.rent[4]}</strong></div>
                    <div class="rent-row highlight"><span>Với KHÁCH SẠN:</span> <strong>$${tile.rent[5]}</strong></div>
                </div>
                <div class="deed-costs">
                    <div>Giá mua: <strong>$${tile.price}</strong></div>
                    <div>Giá xây nhà/KS: <strong>$${tile.houseCost}</strong></div>
                    <div>Giá thế chấp: <strong>$${tile.mortgageValue}</strong></div>
                </div>
                <div class="deed-owner-info">Chủ sở hữu: ${ownerText}</div>
            `;
        } else if (tile.type === 'RAILROAD') {
            bodyHTML = `
                <div class="deed-rent-table">
                    <div class="rent-row"><span>1 Ga Xe Lửa:</span> <strong>$25</strong></div>
                    <div class="rent-row"><span>2 Ga Xe Lửa:</span> <strong>$50</strong></div>
                    <div class="rent-row"><span>3 Ga Xe Lửa:</span> <strong>$100</strong></div>
                    <div class="rent-row"><span>4 Ga Xe Lửa:</span> <strong>$200</strong></div>
                </div>
                <div class="deed-costs">
                    <div>Giá mua: <strong>$${tile.price}</strong></div>
                    <div>Giá thế chấp: <strong>$${tile.mortgageValue}</strong></div>
                </div>
                <div class="deed-owner-info">Chủ sở hữu: ${ownerText}</div>
            `;
        } else if (tile.type === 'UTILITY') {
            bodyHTML = `
                <p class="deed-desc">${tile.description}</p>
                <div class="deed-costs">
                    <div>Giá mua: <strong>$${tile.price}</strong></div>
                    <div>Giá thế chấp: <strong>$${tile.mortgageValue}</strong></div>
                </div>
                <div class="deed-owner-info">Chủ sở hữu: ${ownerText}</div>
            `;
        } else {
            bodyHTML = `<p class="deed-desc">${tile.description || 'Ô chức năng đặc biệt của bàn cờ.'}</p>`;
        }

        if (contentEl) contentEl.innerHTML = bodyHTML;
        if (closeBtn) closeBtn.onclick = () => modalEl.classList.remove('active');

        modalEl.classList.add('active');
    }

    // Hiển thị Modal chiến thắng
    showVictoryModal(winner) {
        state.turnPhase = 'GAME_OVER';
        sound.playFanfare();

        const victoryModalEl = document.getElementById('victory-modal');
        const winnerNameEl = document.getElementById('victory-winner-name');
        const winnerStatsEl = document.getElementById('victory-stats-summary');
        const playAgainBtn = document.getElementById('victory-play-again-btn');

        if (winnerNameEl) winnerNameEl.textContent = `${winner.name} (${winner.isAI ? `AI ${winner.difficulty.toUpperCase()}` : 'NGƯỜI CHƠI'})`;
        if (winnerStatsEl) {
            winnerStatsEl.innerHTML = `
                <p>Tổng tài sản cuối cùng: <strong>$${state.calculateNetWorth(winner.id)}</strong></p>
                <p>Số bất động sản sở hữu: <strong>${state.getPlayerProperties(winner.id).length}</strong></p>
                <p>Tổng tiền thuê đã thu: <strong>$${winner.stats.rentReceived}</strong></p>
                <p>Số lượt đã chơi: <strong>${winner.stats.turnsPlayed}</strong></p>
            `;
        }

        if (playAgainBtn) {
            playAgainBtn.onclick = () => {
                victoryModalEl.classList.remove('active');
                document.getElementById('game-screen').classList.add('hidden');
                document.getElementById('setup-screen').classList.remove('hidden');
            };
        }

        if (victoryModalEl) victoryModalEl.classList.add('active');
    }
}

export const game = new GameEngine();
