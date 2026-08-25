// js/manage.js
// Quản lý Bất Động Sản: Xây Nhà, Bán Nhà, Thế Chấp, Chuộc Đất theo luật chuẩn

import { state } from './state.js';
import { sound } from './audio.js';
import { board } from './board.js';
import { PROPERTY_GROUPS, COLOR_GROUPS } from './data/boardData.js';

export class PropertyManager {
    constructor() {
        this.manageModalEl = null;
        this.selectedPlayerId = null;
    }

    init() {
        this.manageModalEl = document.getElementById('manage-modal');
    }

    // Mở bảng quản lý tài sản cho người chơi
    open(playerId = null) {
        if (!this.manageModalEl) this.init();
        this.selectedPlayerId = (playerId !== null) ? playerId : state.currentTurnPlayerId;
        this.render();
        if (this.manageModalEl) this.manageModalEl.classList.add('active');
    }

    close() {
        if (this.manageModalEl) this.manageModalEl.classList.remove('active');
        board.updateAllTileOwnership();
        window.dispatchEvent(new CustomEvent('monopoly:hud_update'));
    }

    render() {
        const player = state.getPlayer(this.selectedPlayerId);
        if (!player) return;

        const titleEl = document.getElementById('manage-modal-title');
        const balanceEl = document.getElementById('manage-modal-balance');
        const netWorthEl = document.getElementById('manage-modal-networth');
        const listEl = document.getElementById('manage-properties-list');

        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-city" style="color: #3B82F6;"></i> Quản Lý Tài Sản: <strong>${player.name}</strong>`;
        if (balanceEl) balanceEl.textContent = `$${player.money}`;
        if (netWorthEl) netWorthEl.textContent = `$${state.calculateNetWorth(player.id)}`;

        if (!listEl) return;
        listEl.innerHTML = '';

        const ownedProps = state.getPlayerProperties(player.id);
        if (ownedProps.length === 0) {
            listEl.innerHTML = `<div class="empty-state-text" style="text-align: center; padding: 24px; color: var(--text-muted);"><i class="fa-solid fa-folder-open" style="font-size: 28px; margin-bottom: 8px; display: block;"></i> Chưa sở hữu bất động sản nào.</div>`;
            return;
        }

        // Nhóm các tài sản theo Color Group
        const groups = {};
        ownedProps.forEach(prop => {
            if (!groups[prop.group]) groups[prop.group] = [];
            groups[prop.group].push(prop);
        });

        for (const [groupKey, propList] of Object.entries(groups)) {
            const groupInfo = COLOR_GROUPS[groupKey] || { name: groupKey, hex: '#4B5563', houseCost: 0 };
            const groupStatus = state.getColorGroupStatus(groupKey);
            const isFullSet = (groupStatus.isMonopoly && groupStatus.ownerId === player.id);

            const groupContainer = document.createElement('div');
            groupContainer.className = 'property-group-card';
            groupContainer.innerHTML = `
                <div class="group-header" style="border-left: 6px solid ${groupInfo.hex};">
                    <span class="group-name">${groupInfo.name} (${groupStatus.count}/${groupStatus.total})</span>
                    ${isFullSet ? '<span class="monopoly-tag"><i class="fa-solid fa-crown"></i> ĐỘC QUYỀN (x2 THUÊ / ĐƯỢC XÂY)</span>' : ''}
                </div>
                <div class="group-items-list" id="group-items-${groupKey}"></div>
            `;
            listEl.appendChild(groupContainer);

            const itemsListEl = groupContainer.querySelector(`#group-items-${groupKey}`);

            propList.forEach(prop => {
                const tile = state.getTile(prop.id);
                const propItemEl = document.createElement('div');
                propItemEl.className = `manage-prop-row ${prop.isMortgaged ? 'is-mortgaged-row' : ''}`;

                let buildingText = 'Đất trống';
                if (prop.houses > 0 && prop.houses <= 4) buildingText = `${prop.houses} Nhà`;
                else if (prop.houses === 5) buildingText = 'Khách sạn';

                const canBuild = this.canBuildHouse(player.id, prop.id);
                const canSell = this.canSellHouse(player.id, prop.id);
                const canMortgage = this.canMortgageProperty(player.id, prop.id);
                const canUnmortgage = this.canUnmortgageProperty(player.id, prop.id);

                propItemEl.innerHTML = `
                    <div class="prop-info-col">
                        <div class="prop-title-row">
                            <span class="prop-name">${tile.name}</span>
                            ${prop.isMortgaged ? '<span class="status-badge mortgage">ĐANG THẾ CHẤP</span>' : ''}
                        </div>
                        <div class="prop-details-row">
                            <span>Giá gốc: $${tile.price}</span>
                            ${tile.type === 'PROPERTY' ? `<span>Xây dựng: <strong>${buildingText}</strong></span>` : ''}
                            <span>Tiền thuê hiện tại: <strong>$${state.calculateRent(tile.id)}</strong></span>
                        </div>
                    </div>
                    <div class="prop-actions-col">
                        ${tile.type === 'PROPERTY' ? `
                            <button class="btn btn-sm btn-build ${!canBuild.allowed ? 'disabled' : ''}" 
                                    title="${canBuild.reason}" ${!canBuild.allowed ? 'disabled' : ''} 
                                    data-action="build" data-tile="${tile.id}">
                                <i class="fa-solid fa-plus"></i> Xây (${prop.houses === 4 ? 'KS' : 'Nhà'} $${tile.houseCost})
                            </button>
                            <button class="btn btn-sm btn-sell ${!canSell.allowed ? 'disabled' : ''}" 
                                    title="${canSell.reason}" ${!canSell.allowed ? 'disabled' : ''} 
                                    data-action="sell" data-tile="${tile.id}">
                                <i class="fa-solid fa-minus"></i> Bán Nhà (+$${tile.houseCost / 2})
                            </button>
                        ` : ''}
                        
                        ${!prop.isMortgaged ? `
                            <button class="btn btn-sm btn-mortgage ${!canMortgage.allowed ? 'disabled' : ''}" 
                                    title="${canMortgage.reason}" ${!canMortgage.allowed ? 'disabled' : ''} 
                                    data-action="mortgage" data-tile="${tile.id}">
                                <i class="fa-solid fa-hand-holding-dollar"></i> Thế Chấp (+$${tile.mortgageValue})
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-unmortgage ${!canUnmortgage.allowed ? 'disabled' : ''}" 
                                    title="${canUnmortgage.reason}" ${!canUnmortgage.allowed ? 'disabled' : ''} 
                                    data-action="unmortgage" data-tile="${tile.id}">
                                <i class="fa-solid fa-money-bill-wave"></i> Chuộc Lại (-$${tile.unmortgageCost})
                            </button>
                        `}
                    </div>
                `;

                // Gán sự kiện cho các nút hành động
                propItemEl.querySelectorAll('button[data-action]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const action = btn.getAttribute('data-action');
                        const tileId = parseInt(btn.getAttribute('data-tile'), 10);
                        this.handleAction(action, player.id, tileId);
                    });
                });

                itemsListEl.appendChild(propItemEl);
            });
        }
    }

    handleAction(action, playerId, tileId) {
        if (action === 'build') {
            this.buildHouse(playerId, tileId);
        } else if (action === 'sell') {
            this.sellHouse(playerId, tileId);
        } else if (action === 'mortgage') {
            this.mortgageProperty(playerId, tileId);
        } else if (action === 'unmortgage') {
            this.unmortgageProperty(playerId, tileId);
        }
        this.render();
        window.dispatchEvent(new CustomEvent('monopoly:hud_update'));
    }

    // Kiểm tra tính hợp lệ xây nhà (Even Building Rule)
    canBuildHouse(playerId, tileId) {
        const player = state.getPlayer(playerId);
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];

        if (!player || !tile || !prop || prop.ownerId !== playerId || tile.type !== 'PROPERTY') {
            return { allowed: false, reason: 'Không thể xây dựng trên ô này' };
        }

        if (prop.isMortgaged) {
            return { allowed: false, reason: 'Không thể xây dựng khi tài sản đang thế chấp' };
        }

        const groupStatus = state.getColorGroupStatus(tile.group);
        if (!groupStatus.isMonopoly || groupStatus.ownerId !== playerId) {
            return { allowed: false, reason: 'Bạn phải sở hữu trọn bộ nhóm màu này mới được xây nhà' };
        }

        // Kiểm tra xem trong nhóm có ô nào đang bị thế chấp không
        const groupTiles = PROPERTY_GROUPS[tile.group];
        for (const id of groupTiles) {
            if (state.properties[id]?.isMortgaged) {
                return { allowed: false, reason: 'Không thể xây dựng khi có bất động sản cùng nhóm đang thế chấp' };
            }
        }

        if (prop.houses >= 5) {
            return { allowed: false, reason: 'Đã xây tối đa (Khách sạn)' };
        }

        if (player.money < tile.houseCost) {
            return { allowed: false, reason: `Không đủ tiền (Cần $${tile.houseCost})` };
        }

        // Luật xây dựng đồng đều: Không được xây nếu số nhà ô này đang lớn hơn ô có số nhà nhỏ nhất trong nhóm
        let minHousesInGroup = 5;
        groupTiles.forEach(id => {
            const h = state.properties[id].houses;
            if (h < minHousesInGroup) minHousesInGroup = h;
        });

        if (prop.houses > minHousesInGroup) {
            return { allowed: false, reason: 'Quy tắc xây đồng đều: Cần xây cho các ô khác trong nhóm trước' };
        }

        // Kiểm tra số lượng nhà/khách sạn trong kho Ngân Hàng
        if (prop.houses === 4) {
            if (state.bank.availableHotels <= 0) {
                return { allowed: false, reason: 'Ngân Hàng đã hết khách sạn!' };
            }
        } else {
            if (state.bank.availableHouses <= 0) {
                return { allowed: false, reason: 'Ngân Hàng đã hết nhà!' };
            }
        }

        return { allowed: true, reason: 'Hợp lệ để xây dựng' };
    }

    buildHouse(playerId, tileId) {
        const validation = this.canBuildHouse(playerId, tileId);
        if (!validation.allowed) return false;

        const player = state.getPlayer(playerId);
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];

        player.money -= tile.houseCost;
        if (prop.houses === 4) {
            prop.houses = 5;
            state.bank.availableHouses += 4; // Trả lại 4 nhà cho ngân hàng
            state.bank.availableHotels -= 1;
            sound.playBuy();
            state.addLog(`<strong>${player.name}</strong> đã nâng cấp lên <strong>Khách Sạn</strong> tại <strong>${tile.name}</strong> (-$${tile.houseCost})`, 'success', player.id);
        } else {
            prop.houses += 1;
            state.bank.availableHouses -= 1;
            sound.playBuy();
            state.addLog(`<strong>${player.name}</strong> đã xây thêm 1 căn nhà tại <strong>${tile.name}</strong> (Tổng: ${prop.houses} nhà) (-$${tile.houseCost})`, 'success', player.id);
        }

        player.stats.housesBuilt++;
        board.updateTileOwnership(tileId);
        state.saveToStorage();
        return true;
    }

    // Kiểm tra tính hợp lệ bán nhà (Even Selling Rule)
    canSellHouse(playerId, tileId) {
        const player = state.getPlayer(playerId);
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];

        if (!player || !tile || !prop || prop.ownerId !== playerId || prop.houses === 0) {
            return { allowed: false, reason: 'Không có nhà để bán' };
        }

        // Luật bán đồng đều: Không được bán ô này nếu số nhà ô này đang ít hơn ô có số nhà nhiều nhất trong nhóm
        const groupTiles = PROPERTY_GROUPS[tile.group];
        let maxHousesInGroup = 0;
        groupTiles.forEach(id => {
            const h = state.properties[id].houses;
            if (h > maxHousesInGroup) maxHousesInGroup = h;
        });

        if (prop.houses < maxHousesInGroup) {
            return { allowed: false, reason: 'Quy tắc bán đồng đều: Cần bán từ ô có nhiều nhà hơn trước' };
        }

        return { allowed: true, reason: 'Hợp lệ để bán' };
    }

    sellHouse(playerId, tileId) {
        const validation = this.canSellHouse(playerId, tileId);
        if (!validation.allowed) return false;

        const player = state.getPlayer(playerId);
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];

        const refund = tile.houseCost / 2;
        player.money += refund;

        if (prop.houses === 5) {
            prop.houses = 4;
            state.bank.availableHotels += 1;
            state.bank.availableHouses -= 4;
            sound.playBuy();
            state.addLog(`<strong>${player.name}</strong> đã hạ Khách Sạn về 4 nhà tại <strong>${tile.name}</strong> (+$${refund})`, 'info', player.id);
        } else {
            prop.houses -= 1;
            state.bank.availableHouses += 1;
            sound.playBuy();
            state.addLog(`<strong>${player.name}</strong> đã bán 1 căn nhà tại <strong>${tile.name}</strong> (+$${refund})`, 'info', player.id);
        }

        board.updateTileOwnership(tileId);
        state.saveToStorage();
        return true;
    }

    // Kiểm tra thế chấp
    canMortgageProperty(playerId, tileId) {
        const player = state.getPlayer(playerId);
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];

        if (!player || !tile || !prop || prop.ownerId !== playerId || prop.isMortgaged) {
            return { allowed: false, reason: 'Không thể thế chấp' };
        }

        // Nếu là đất, cả nhóm màu phải không còn nhà/khách sạn nào
        if (tile.type === 'PROPERTY') {
            const groupTiles = PROPERTY_GROUPS[tile.group];
            for (const id of groupTiles) {
                if (state.properties[id]?.houses > 0) {
                    return { allowed: false, reason: 'Phải bán hết tất cả nhà/khách sạn trong cùng nhóm màu trước khi thế chấp' };
                }
            }
        }

        return { allowed: true, reason: 'Có thể thế chấp' };
    }

    mortgageProperty(playerId, tileId) {
        const validation = this.canMortgageProperty(playerId, tileId);
        if (!validation.allowed) return false;

        const player = state.getPlayer(playerId);
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];

        prop.isMortgaged = true;
        player.money += tile.mortgageValue;
        sound.playBuy();
        state.addLog(`<strong>${player.name}</strong> đã thế chấp <strong>${tile.name}</strong> để nhận $${tile.mortgageValue}`, 'warning', player.id);
        board.updateTileOwnership(tileId);
        state.saveToStorage();
        return true;
    }

    // Kiểm tra chuộc đất
    canUnmortgageProperty(playerId, tileId) {
        const player = state.getPlayer(playerId);
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];

        if (!player || !tile || !prop || prop.ownerId !== playerId || !prop.isMortgaged) {
            return { allowed: false, reason: 'Không thể chuộc' };
        }

        if (player.money < tile.unmortgageCost) {
            return { allowed: false, reason: `Không đủ tiền (Cần $${tile.unmortgageCost})` };
        }

        return { allowed: true, reason: 'Có thể chuộc lại' };
    }

    unmortgageProperty(playerId, tileId) {
        const validation = this.canUnmortgageProperty(playerId, tileId);
        if (!validation.allowed) return false;

        const player = state.getPlayer(playerId);
        const tile = state.getTile(tileId);
        const prop = state.properties[tileId];

        player.money -= tile.unmortgageCost;
        prop.isMortgaged = false;
        sound.playBuy();
        state.addLog(`<strong>${player.name}</strong> đã chuộc lại <strong>${tile.name}</strong> (-$${tile.unmortgageCost})`, 'success', player.id);
        board.updateTileOwnership(tileId);
        state.saveToStorage();
        return true;
    }
}

export const manage = new PropertyManager();
