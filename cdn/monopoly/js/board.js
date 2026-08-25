// js/board.js
// Quản lý Render Bàn Cờ 11x11, Vị Trí Token và Công Trình Nhà/Khách Sạn

import { BOARD_TILES, COLOR_GROUPS } from './data/boardData.js';
import { state } from './state.js';
import { sound } from './audio.js';

export class BoardRenderer {
    constructor() {
        this.boardContainer = null;
        this.tokensContainer = null;
        this.onTileClickCallback = null;
    }

    init(containerId = 'monopoly-board', onTileClick = null) {
        this.boardContainer = document.getElementById(containerId);
        this.onTileClickCallback = onTileClick;
        if (!this.boardContainer) return;
        this.renderTiles();
    }

    renderTiles() {
        this.boardContainer.innerHTML = '';

        // Tạo trung tâm bàn cờ (Center area)
        const centerArea = document.createElement('div');
        centerArea.className = 'board-center';
        centerArea.id = 'board-center-area';
        centerArea.innerHTML = `
            <div class="center-branding">
                <div class="monopoly-logo-box">
                    <span class="logo-text">CỜ TỶ PHÚ</span>
                    <span class="logo-sub">CLASSIC EDITION</span>
                </div>
            </div>
            <!-- Khu vực tung xúc xắc và điều khiển trên bàn cờ -->
            <div class="dice-station" id="dice-station">
                <div class="dice-container">
                    <div class="die-3d" id="die-1">
                        <div class="face front"><span></span></div>
                        <div class="face back"><span></span><span></span></div>
                        <div class="face right"><span></span><span></span><span></span></div>
                        <div class="face left"><span></span><span></span><span></span><span></span></div>
                        <div class="face top"><span></span><span></span><span></span><span></span><span></span></div>
                        <div class="face bottom"><span></span><span></span><span></span><span></span><span></span><span></span></div>
                    </div>
                    <div class="die-3d" id="die-2">
                        <div class="face front"><span></span></div>
                        <div class="face back"><span></span><span></span></div>
                        <div class="face right"><span></span><span></span><span></span></div>
                        <div class="face left"><span></span><span></span><span></span><span></span></div>
                        <div class="face top"><span></span><span></span><span></span><span></span><span></span></div>
                        <div class="face bottom"><span></span><span></span><span></span><span></span><span></span><span></span></div>
                    </div>
                </div>
                <div class="dice-info" id="dice-result-text">Sẵn sàng đổ xúc xắc</div>
            </div>
            <div class="decks-visual">
                <div class="card-deck-slot chance-slot">
                    <i class="fa-solid fa-question"></i>
                    <span>KHÍ VẬN</span>
                </div>
                <div class="card-deck-slot chest-slot">
                    <i class="fa-solid fa-box-open"></i>
                    <span>CƠ HỘI</span>
                </div>
            </div>
        `;
        this.boardContainer.appendChild(centerArea);

        // Tạo 40 ô xung quanh bàn cờ
        BOARD_TILES.forEach(tile => {
            const tileEl = document.createElement('div');
            tileEl.className = `board-tile tile-${tile.id} tile-type-${tile.type.toLowerCase()}`;
            tileEl.id = `tile-${tile.id}`;
            tileEl.style.gridRow = tile.grid.row;
            tileEl.style.gridColumn = tile.grid.col;

            // Xác định vị trí viền cạnh bàn cờ: bottom, left, top, right
            if (tile.grid.row === 11 && tile.grid.col > 1 && tile.grid.col < 11) tileEl.classList.add('edge-bottom');
            else if (tile.grid.col === 1 && tile.grid.row > 1 && tile.grid.row < 11) tileEl.classList.add('edge-left');
            else if (tile.grid.row === 1 && tile.grid.col > 1 && tile.grid.col < 11) tileEl.classList.add('edge-top');
            else if (tile.grid.col === 11 && tile.grid.row > 1 && tile.grid.row < 11) tileEl.classList.add('edge-right');
            else tileEl.classList.add('corner-tile');

            // Xây dựng nội dung từng ô
            tileEl.innerHTML = this.buildTileHTML(tile);

            tileEl.addEventListener('click', () => {
                sound.playClick();
                if (this.onTileClickCallback) {
                    this.onTileClickCallback(tile.id);
                }
            });

            this.boardContainer.appendChild(tileEl);
        });

        this.updateAllTileOwnership();
    }

    buildTileHTML(tile) {
        let headerColor = '';
        if (tile.group && COLOR_GROUPS[tile.group] && tile.group !== 'SPECIAL') {
            headerColor = COLOR_GROUPS[tile.group].hex;
        }

        let innerHTML = '';

        if (tile.type === 'PROPERTY') {
            innerHTML = `
                <div class="tile-color-bar" style="background-color: ${headerColor};">
                    <div class="building-slots" id="buildings-tile-${tile.id}"></div>
                </div>
                <div class="tile-content">
                    <div class="tile-name">${tile.shortName || tile.name}</div>
                    <div class="tile-price">$${tile.price}</div>
                </div>
                <div class="owner-indicator" id="owner-badge-${tile.id}"></div>
                <div class="tokens-slot" id="tokens-tile-${tile.id}"></div>
            `;
        } else if (tile.type === 'RAILROAD' || tile.type === 'UTILITY') {
            innerHTML = `
                <div class="tile-header-special">
                    <i class="${tile.icon}"></i>
                </div>
                <div class="tile-content">
                    <div class="tile-name">${tile.shortName || tile.name}</div>
                    <div class="tile-price">$${tile.price}</div>
                </div>
                <div class="owner-indicator" id="owner-badge-${tile.id}"></div>
                <div class="tokens-slot" id="tokens-tile-${tile.id}"></div>
            `;
        } else if (tile.type === 'GO') {
            innerHTML = `
                <div class="corner-content go-corner">
                    <div class="go-label">THU $200 KHI ĐI QUA</div>
                    <div class="go-title">BẮT ĐẦU</div>
                    <i class="fa-solid fa-arrow-left go-arrow"></i>
                </div>
                <div class="tokens-slot" id="tokens-tile-${tile.id}"></div>
            `;
        } else if (tile.type === 'JAIL') {
            innerHTML = `
                <div class="jail-corner-grid">
                    <div class="in-jail-cell">
                        <i class="fa-solid fa-lock"></i>
                        <span>TRONG TÙ</span>
                    </div>
                    <div class="just-visiting-top">THĂM</div>
                    <div class="just-visiting-side">TÙ</div>
                </div>
                <div class="tokens-slot" id="tokens-tile-${tile.id}"></div>
            `;
        } else if (tile.type === 'GO_TO_JAIL') {
            innerHTML = `
                <div class="corner-content go-to-jail-corner">
                    <div class="corner-title">VÀO TÙ</div>
                    <i class="fa-solid fa-handcuffs corner-icon"></i>
                    <div class="corner-sub">ĐI THẲNG</div>
                </div>
                <div class="tokens-slot" id="tokens-tile-${tile.id}"></div>
            `;
        } else if (tile.type === 'PARKING') {
            innerHTML = `
                <div class="corner-content parking-corner">
                    <div class="corner-title">BÃI ĐỖ XE</div>
                    <i class="fa-solid fa-car corner-icon"></i>
                    <div class="corner-sub">MIỄN PHÍ</div>
                </div>
                <div class="tokens-slot" id="tokens-tile-${tile.id}"></div>
            `;
        } else if (tile.type === 'CHANCE') {
            innerHTML = `
                <div class="tile-header-special chance-header">
                    <i class="fa-solid fa-question"></i>
                </div>
                <div class="tile-content">
                    <div class="tile-name">KHÍ VẬN</div>
                </div>
                <div class="tokens-slot" id="tokens-tile-${tile.id}"></div>
            `;
        } else if (tile.type === 'CHEST') {
            innerHTML = `
                <div class="tile-header-special chest-header">
                    <i class="fa-solid fa-box-open"></i>
                </div>
                <div class="tile-content">
                    <div class="tile-name">CƠ HỘI</div>
                </div>
                <div class="tokens-slot" id="tokens-tile-${tile.id}"></div>
            `;
        } else if (tile.type === 'TAX') {
            innerHTML = `
                <div class="tile-header-special tax-header">
                    <i class="${tile.icon}"></i>
                </div>
                <div class="tile-content">
                    <div class="tile-name">${tile.name}</div>
                    <div class="tile-price">Nộp $${tile.taxAmount}</div>
                </div>
                <div class="tokens-slot" id="tokens-tile-${tile.id}"></div>
            `;
        }

        return innerHTML;
    }

    // Cập nhật tất cả các token trên bàn cờ
    updatePlayerTokens() {
        // Xóa sạch slot token trên tất cả 40 ô
        for (let i = 0; i < 40; i++) {
            const slot = document.getElementById(`tokens-tile-${i}`);
            if (slot) slot.innerHTML = '';
        }

        // Đặt token của từng người chơi còn hoạt động
        state.players.forEach(player => {
            if (player.bankrupt) return;
            const slot = document.getElementById(`tokens-tile-${player.position}`);
            if (slot) {
                const tokenEl = document.createElement('div');
                tokenEl.className = `player-token token-${player.id} ${state.currentTurnPlayerId === player.id ? 'active-turn' : ''}`;
                tokenEl.style.backgroundColor = player.token.color;
                tokenEl.title = `${player.name} ($${player.money})`;
                tokenEl.innerHTML = `<i class="${player.token.icon}"></i>`;
                slot.appendChild(tokenEl);
            }
        });
    }

    // Di chuyển token từng bước mượt mà
    async animatePlayerMove(playerId, fromPos, toPos, speed = 'normal') {
        const player = state.getPlayer(playerId);
        if (!player) return;

        let steps = (toPos - fromPos + 40) % 40;
        if (steps === 0 && fromPos !== toPos) steps = 40;

        let delay = 160;
        if (speed === 'fast') delay = 80;
        if (speed === 'instant') delay = 0;

        let currentPos = fromPos;
        for (let i = 0; i < steps; i++) {
            currentPos = (currentPos + 1) % 40;
            player.position = currentPos;
            this.updatePlayerTokens();
            sound.playStep();
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Cập nhật chủ sở hữu, nhà và khách sạn trên ô
    updateAllTileOwnership() {
        BOARD_TILES.forEach(tile => {
            this.updateTileOwnership(tile.id);
        });
    }

    updateTileOwnership(tileId) {
        const prop = state.properties[tileId];
        const tileEl = document.getElementById(`tile-${tileId}`);
        if (!prop || !tileEl) return;

        const ownerBadge = document.getElementById(`owner-badge-${tileId}`);
        const buildingsSlot = document.getElementById(`buildings-tile-${tileId}`);

        if (prop.ownerId !== null && prop.ownerId !== undefined) {
            const owner = state.getPlayer(prop.ownerId);
            if (owner) {
                tileEl.classList.add('is-owned');
                tileEl.style.borderBottomColor = owner.token.color;

                if (ownerBadge) {
                    ownerBadge.style.backgroundColor = owner.token.color;
                    ownerBadge.innerHTML = `<i class="${owner.token.icon}"></i>`;
                    ownerBadge.title = `Chủ sở hữu: ${owner.name}`;
                    ownerBadge.style.display = 'flex';
                }

                if (prop.isMortgaged) {
                    tileEl.classList.add('is-mortgaged');
                    if (ownerBadge) ownerBadge.classList.add('badge-mortgaged');
                } else {
                    tileEl.classList.remove('is-mortgaged');
                    if (ownerBadge) ownerBadge.classList.remove('badge-mortgaged');
                }
            }
        } else {
            tileEl.classList.remove('is-owned', 'is-mortgaged');
            if (ownerBadge) {
                ownerBadge.style.display = 'none';
                ownerBadge.innerHTML = '';
            }
        }

        // Cập nhật nhà / khách sạn
        if (buildingsSlot) {
            buildingsSlot.innerHTML = '';
            if (prop.houses > 0 && prop.houses <= 4) {
                for (let h = 0; h < prop.houses; h++) {
                    const houseEl = document.createElement('span');
                    houseEl.className = 'mini-house';
                    houseEl.title = `${prop.houses} Nhà`;
                    buildingsSlot.appendChild(houseEl);
                }
            } else if (prop.houses === 5) {
                const hotelEl = document.createElement('span');
                hotelEl.className = 'mini-hotel';
                hotelEl.title = 'Khách sạn';
                buildingsSlot.appendChild(hotelEl);
            }
        }
    }
}

export const board = new BoardRenderer();
