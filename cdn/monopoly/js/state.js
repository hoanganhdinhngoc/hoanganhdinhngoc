// js/state.js
// Quản lý Trạng Thái Trung Tâm của Game Cờ Tỷ Phú

import { BOARD_TILES, PROPERTY_GROUPS, COLOR_GROUPS } from './data/boardData.js';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from './data/cardsData.js';

export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.players = [];
        this.properties = {}; // tileId -> { ownerId, houses (0-5), isMortgaged }
        this.bank = {
            totalHouses: 32,
            totalHotels: 12,
            availableHouses: 32,
            availableHotels: 12
        };
        this.chanceDeck = [];
        this.chanceDiscard = [];
        this.chestDeck = [];
        this.chestDiscard = [];
        this.currentTurnPlayerId = 0;
        this.doublesRolledCount = 0;
        this.diceState = { die1: 1, die2: 1, total: 2, isDouble: false };
        this.turnPhase = 'INITIAL'; // 'INITIAL', 'ROLL', 'TILE_ACTION', 'MANAGE_OR_END', 'GAME_OVER'
        this.gameSpeed = 'normal'; // 'normal', 'fast', 'instant'
        this.gameLogs = [];
        this.isAiProcessing = false;
        this.turnCount = 1;

        // Khởi tạo trạng thái cho tất cả các ô trên bàn cờ
        BOARD_TILES.forEach(tile => {
            if (tile.type === 'PROPERTY' || tile.type === 'RAILROAD' || tile.type === 'UTILITY') {
                this.properties[tile.id] = {
                    ownerId: null,
                    houses: 0, // 0 = đất trống, 1-4 = nhà, 5 = khách sạn
                    isMortgaged: false
                };
            }
        });

        // Xáo bài
        this.initCardDecks();
    }

    initCardDecks() {
        this.chanceDeck = this.shuffle([...CHANCE_CARDS]);
        this.chanceDiscard = [];
        this.chestDeck = this.shuffle([...COMMUNITY_CHEST_CARDS]);
        this.chestDiscard = [];
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    initPlayers(playerConfigs) {
        this.players = playerConfigs.map((config, index) => ({
            id: index,
            name: config.name || `Người chơi ${index + 1}`,
            isAI: config.isAI || false,
            difficulty: config.difficulty || 'normal', // 'easy', 'normal', 'hard', 'very_hard'
            token: config.token,
            money: 1500,
            position: 0,
            inJail: false,
            jailTurns: 0,
            jailCards: 0,
            bankrupt: false,
            stats: {
                turnsPlayed: 0,
                rentPaid: 0,
                rentReceived: 0,
                propertiesBought: 0,
                housesBuilt: 0,
                timesInJail: 0
            }
        }));

        this.currentTurnPlayerId = 0;
        this.turnPhase = 'ROLL';
        this.doublesRolledCount = 0;
        this.addLog(`Trò chơi bắt đầu với ${this.players.length} người chơi. Lượt của ${this.getActivePlayer().name}!`, 'info');
    }

    getActivePlayer() {
        return this.players[this.currentTurnPlayerId];
    }

    getPlayer(id) {
        return this.players.find(p => p.id === id);
    }

    getTile(id) {
        return BOARD_TILES.find(t => t.id === id);
    }

    getPropertyState(tileId) {
        return this.properties[tileId] || null;
    }

    getPlayerProperties(playerId) {
        const owned = [];
        for (const [tileIdStr, prop] of Object.entries(this.properties)) {
            if (prop.ownerId === playerId) {
                const tile = this.getTile(parseInt(tileIdStr, 10));
                owned.push({ ...tile, ...prop });
            }
        }
        return owned;
    }

    // Kiểm tra độc quyền (Monopoly) của nhóm màu
    getColorGroupStatus(groupKey) {
        const tileIds = PROPERTY_GROUPS[groupKey];
        if (!tileIds || tileIds.length === 0) return { isMonopoly: false, ownerId: null, count: 0, total: 0 };

        const firstOwner = this.properties[tileIds[0]]?.ownerId;
        if (firstOwner === null || firstOwner === undefined) {
            return { isMonopoly: false, ownerId: null, count: 0, total: tileIds.length };
        }

        let isMonopoly = true;
        let count = 0;
        tileIds.forEach(id => {
            if (this.properties[id]?.ownerId === firstOwner) {
                count++;
            } else {
                isMonopoly = false;
            }
        });

        return {
            isMonopoly,
            ownerId: isMonopoly ? firstOwner : null,
            count,
            total: tileIds.length
        };
    }

    // Tính toán giá thuê thực tế tại một ô
    calculateRent(tileId, diceTotal = 0) {
        const tile = this.getTile(tileId);
        const prop = this.properties[tileId];

        if (!tile || !prop || prop.ownerId === null || prop.isMortgaged) {
            return 0;
        }

        if (tile.type === 'PROPERTY') {
            if (prop.houses === 0) {
                const groupStatus = this.getColorGroupStatus(tile.group);
                // Nếu sở hữu trọn bộ màu nhưng chưa xây nhà -> Giá thuê đất x2
                if (groupStatus.isMonopoly && groupStatus.ownerId === prop.ownerId) {
                    return tile.rent[0] * 2;
                }
                return tile.rent[0];
            } else {
                // prop.houses: 1-4 nhà, 5 = khách sạn
                return tile.rent[prop.houses];
            }
        }

        if (tile.type === 'RAILROAD') {
            const rrIds = PROPERTY_GROUPS.RAILROAD;
            let ownedCount = 0;
            rrIds.forEach(id => {
                if (this.properties[id]?.ownerId === prop.ownerId && !this.properties[id]?.isMortgaged) {
                    ownedCount++;
                }
            });
            if (ownedCount === 0) return 0;
            return tile.rent[ownedCount - 1] || 25;
        }

        if (tile.type === 'UTILITY') {
            const utilIds = PROPERTY_GROUPS.UTILITY;
            let ownedCount = 0;
            utilIds.forEach(id => {
                if (this.properties[id]?.ownerId === prop.ownerId && !this.properties[id]?.isMortgaged) {
                    ownedCount++;
                }
            });
            const multiplier = (ownedCount >= 2) ? 10 : 4;
            const roll = diceTotal || (this.diceState.total || 7);
            return roll * multiplier;
        }

        return 0;
    }

    // Tính tổng tài sản ròng (Net Worth) của người chơi
    calculateNetWorth(playerId) {
        const player = this.getPlayer(playerId);
        if (!player || player.bankrupt) return 0;

        let total = player.money;
        const owned = this.getPlayerProperties(playerId);

        owned.forEach(prop => {
            // Giá trị đất (nếu thế chấp tính 50%)
            if (prop.isMortgaged) {
                total += prop.mortgageValue;
            } else {
                total += prop.price;
            }
            // Giá trị công trình xây dựng (tính 50% giá hoàn trả)
            if (prop.houses > 0 && prop.houseCost) {
                total += prop.houses * (prop.houseCost / 2);
            }
        });

        return total;
    }

    // Ghi log sự kiện
    addLog(text, type = 'info', playerId = null) {
        const logItem = {
            id: Date.now() + Math.random(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text,
            type, // 'info', 'success', 'warning', 'danger', 'trade', 'dice'
            playerId
        };
        this.gameLogs.unshift(logItem);
        if (this.gameLogs.length > 100) this.gameLogs.pop();

        // Phát sự kiện cập nhật log
        window.dispatchEvent(new CustomEvent('monopoly:log', { detail: logItem }));
    }

    // Chuyển lượt sang người chơi tiếp theo còn sống
    nextTurn() {
        this.doublesRolledCount = 0;
        let nextId = (this.currentTurnPlayerId + 1) % this.players.length;
        let loopCount = 0;

        while (this.players[nextId].bankrupt && loopCount < this.players.length) {
            nextId = (nextId + 1) % this.players.length;
            loopCount++;
        }

        this.currentTurnPlayerId = nextId;
        this.turnPhase = 'ROLL';
        this.turnCount++;

        const active = this.getActivePlayer();
        active.stats.turnsPlayed++;

        this.addLog(`Đến lượt của <strong>${active.name}</strong> (Số dư: $${active.money})`, 'info', active.id);
        this.saveToStorage();
    }

    getActivePlayersCount() {
        return this.players.filter(p => !p.bankrupt).length;
    }

    getWinner() {
        const active = this.players.filter(p => !p.bankrupt);
        return (active.length === 1) ? active[0] : null;
    }

    saveToStorage() {
        try {
            const data = {
                players: this.players,
                properties: this.properties,
                bank: this.bank,
                currentTurnPlayerId: this.currentTurnPlayerId,
                turnPhase: this.turnPhase,
                doublesRolledCount: this.doublesRolledCount,
                gameSpeed: this.gameSpeed,
                turnCount: this.turnCount,
                gameLogs: this.gameLogs.slice(0, 30)
            };
            localStorage.setItem('monopoly_save_state', JSON.stringify(data));
        } catch (e) {
            console.warn('Cannot save to LocalStorage:', e);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('monopoly_save_state');
            if (!saved) return false;
            const data = JSON.parse(saved);
            this.players = data.players;
            this.properties = data.properties;
            this.bank = data.bank;
            this.currentTurnPlayerId = data.currentTurnPlayerId;
            this.turnPhase = data.turnPhase;
            this.doublesRolledCount = data.doublesRolledCount || 0;
            this.gameSpeed = data.gameSpeed || 'normal';
            this.turnCount = data.turnCount || 1;
            this.gameLogs = data.gameLogs || [];
            this.initCardDecks();
            return true;
        } catch (e) {
            console.error('Failed to load save state:', e);
            return false;
        }
    }

    hasSaveData() {
        return localStorage.getItem('monopoly_save_state') !== null;
    }

    clearSaveData() {
        localStorage.removeItem('monopoly_save_state');
    }
}

export const state = new GameState();
