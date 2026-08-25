// js/main.js
// Điểm Khởi Chạy Ứng Dụng & Quản Lý Màn Hình Thiết Lập (Setup Wizard)

import { TOKEN_CONFIGS } from './data/boardData.js';
import { sound } from './audio.js';
import { state } from './state.js';
import { game } from './game.js';

class App {
    constructor() {
        this.playerConfigs = [
            { name: 'Người chơi 1', isAI: false, difficulty: 'normal', token: TOKEN_CONFIGS[0] },
            { name: 'Bot Cao Thủ', isAI: true, difficulty: 'hard', token: TOKEN_CONFIGS[1] },
            { name: 'Bot Tân Thủ', isAI: true, difficulty: 'easy', token: TOKEN_CONFIGS[2] },
            { name: 'Bot Bậc Thầy', isAI: true, difficulty: 'very_hard', token: TOKEN_CONFIGS[3] }
        ];
    }

    init() {
        this.renderSetupPlayers();
        this.bindSetupEvents();
        this.bindGameControls();
        this.bindLogListener();
        this.checkSavedGame();
    }

    // Render danh sách cấu hình người chơi trong Setup Wizard
    renderSetupPlayers() {
        const container = document.getElementById('setup-players-list');
        if (!container) return;
        container.innerHTML = '';

        this.playerConfigs.forEach((p, idx) => {
            const row = document.createElement('div');
            row.className = 'setup-player-card';
            row.innerHTML = `
                <div class="player-order-badge">${idx + 1}</div>
                <div class="setup-field token-select-field">
                    <label>Token</label>
                    <div class="token-preview" style="background-color: ${p.token.color};">
                        <i class="${p.token.icon}"></i>
                    </div>
                </div>
                <div class="setup-field name-field">
                    <label>Tên</label>
                    <input type="text" class="input-player-name" value="${p.name}" data-idx="${idx}">
                </div>
                <div class="setup-field type-field">
                    <label>Loại</label>
                    <select class="select-player-type" data-idx="${idx}">
                        <option value="human" ${!p.isAI ? 'selected' : ''}>👤 Người</option>
                        <option value="ai" ${p.isAI ? 'selected' : ''}>🤖 AI Bot</option>
                    </select>
                </div>
                <div class="setup-field diff-field ${!p.isAI ? 'disabled-field' : ''}">
                    <label>Cấp độ AI</label>
                    <select class="select-player-diff" data-idx="${idx}" ${!p.isAI ? 'disabled' : ''}>
                        <option value="easy" ${p.difficulty === 'easy' ? 'selected' : ''}>🟢 Easy (Tân thủ)</option>
                        <option value="normal" ${p.difficulty === 'normal' ? 'selected' : ''}>🟡 Normal (Vừa)</option>
                        <option value="hard" ${p.difficulty === 'hard' ? 'selected' : ''}>🔴 Hard (Chiến lược)</option>
                        <option value="very_hard" ${p.difficulty === 'very_hard' ? 'selected' : ''}>🟣 Very Hard (Bậc thầy)</option>
                    </select>
                </div>
                <div class="setup-actions">
                    ${this.playerConfigs.length > 2 ? `
                        <button class="btn-remove-player" title="Xóa người chơi" data-idx="${idx}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    ` : ''}
                </div>
            `;

            // Gán sự kiện thay đổi
            const nameInput = row.querySelector('.input-player-name');
            nameInput.oninput = (e) => {
                this.playerConfigs[idx].name = e.target.value;
            };

            const typeSelect = row.querySelector('.select-player-type');
            typeSelect.onchange = (e) => {
                const isAI = e.target.value === 'ai';
                this.playerConfigs[idx].isAI = isAI;
                if (!isAI && this.playerConfigs[idx].name.startsWith('Bot')) {
                    this.playerConfigs[idx].name = `Người chơi ${idx + 1}`;
                } else if (isAI && this.playerConfigs[idx].name.startsWith('Người chơi')) {
                    this.playerConfigs[idx].name = `Bot ${this.playerConfigs[idx].difficulty.toUpperCase()}`;
                }
                this.renderSetupPlayers();
            };

            const diffSelect = row.querySelector('.select-player-diff');
            diffSelect.onchange = (e) => {
                this.playerConfigs[idx].difficulty = e.target.value;
            };

            const removeBtn = row.querySelector('.btn-remove-player');
            if (removeBtn) {
                removeBtn.onclick = () => {
                    sound.playClick();
                    this.playerConfigs.splice(idx, 1);
                    this.renderSetupPlayers();
                };
            }

            container.appendChild(row);
        });

        // Cập nhật nút Thêm người chơi (Tối đa 6 người)
        const addBtn = document.getElementById('btn-add-player');
        if (addBtn) {
            addBtn.style.display = (this.playerConfigs.length < 6) ? 'inline-flex' : 'none';
        }
    }

    bindSetupEvents() {
        const addBtn = document.getElementById('btn-add-player');
        if (addBtn) {
            addBtn.onclick = () => {
                sound.playClick();
                if (this.playerConfigs.length >= 6) return;
                const nextIdx = this.playerConfigs.length;
                this.playerConfigs.push({
                    name: `Bot ${nextIdx + 1}`,
                    isAI: true,
                    difficulty: 'normal',
                    token: TOKEN_CONFIGS[nextIdx % TOKEN_CONFIGS.length]
                });
                this.renderSetupPlayers();
            };
        }

        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) {
            startBtn.onclick = () => {
                sound.playBuy();
                document.getElementById('setup-screen').classList.add('hidden');
                document.getElementById('game-screen').classList.remove('hidden');
                game.init();
                game.startGame(this.playerConfigs);
            };
        }

        const resumeBtn = document.getElementById('btn-resume-game');
        if (resumeBtn) {
            resumeBtn.onclick = () => {
                sound.playClick();
                document.getElementById('setup-screen').classList.add('hidden');
                document.getElementById('game-screen').classList.remove('hidden');
                game.init();
                game.resumeGame();
            };
        }
    }

    checkSavedGame() {
        const resumeBtn = document.getElementById('btn-resume-game');
        if (resumeBtn) {
            resumeBtn.style.display = state.hasSaveData() ? 'inline-flex' : 'none';
        }
    }

    bindGameControls() {
        // Tắt/Mở âm thanh
        const soundBtn = document.getElementById('btn-toggle-sound');
        if (soundBtn) {
            const updateSoundIcon = () => {
                soundBtn.innerHTML = sound.isMuted 
                    ? '<i class="fa-solid fa-volume-xmark"></i>' 
                    : '<i class="fa-solid fa-volume-high"></i>';
            };
            updateSoundIcon();
            soundBtn.onclick = () => {
                sound.toggleMute();
                updateSoundIcon();
            };
        }

        // Tốc độ game (Normal, Fast, Instant)
        const speedBtns = document.querySelectorAll('.btn-speed');
        speedBtns.forEach(btn => {
            btn.onclick = () => {
                sound.playClick();
                speedBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.gameSpeed = btn.getAttribute('data-speed');
            };
        });

        // Nút Thoát / Game mới
        const restartBtn = document.getElementById('btn-restart-game');
        if (restartBtn) {
            restartBtn.onclick = () => {
                if (confirm('Bạn có chắc chắn muốn thoát về màn hình cài đặt không? Tiến trình hiện tại đã được lưu.')) {
                    document.getElementById('game-screen').classList.add('hidden');
                    document.getElementById('setup-screen').classList.remove('hidden');
                    this.checkSavedGame();
                }
            };
        }

        // Modal Hướng dẫn / Luật chơi
        const rulesBtn = document.getElementById('btn-rules-help');
        const rulesModal = document.getElementById('rules-modal');
        const closeRulesBtn = document.getElementById('rules-modal-close');

        if (rulesBtn && rulesModal) {
            rulesBtn.onclick = () => rulesModal.classList.add('active');
        }
        if (closeRulesBtn && rulesModal) {
            closeRulesBtn.onclick = () => rulesModal.classList.remove('active');
        }

        // Đóng các modal bằng nút bấm close bên trong
        document.querySelectorAll('.modal-close-trigger').forEach(btn => {
            btn.onclick = () => {
                btn.closest('.modal-overlay')?.classList.remove('active');
            };
        });
    }

    bindLogListener() {
        const logBox = document.getElementById('game-logs-container');
        if (!logBox) return;

        window.addEventListener('monopoly:log', (e) => {
            const log = e.detail;
            const item = document.createElement('div');
            item.className = `log-item log-type-${log.type}`;

            let iconClass = 'fa-solid fa-info-circle';
            if (log.type === 'success') iconClass = 'fa-solid fa-circle-check';
            else if (log.type === 'danger') iconClass = 'fa-solid fa-triangle-exclamation';
            else if (log.type === 'warning') iconClass = 'fa-solid fa-bell';
            else if (log.type === 'trade') iconClass = 'fa-solid fa-handshake';

            item.innerHTML = `
                <span class="log-time">${log.time}</span>
                <i class="${iconClass} log-icon"></i>
                <span class="log-text">${log.text}</span>
            `;

            logBox.insertBefore(item, logBox.firstChild);
        });
    }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
