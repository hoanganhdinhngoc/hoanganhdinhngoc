// js/audio.js
// Bộ tổng hợp âm thanh đa dạng bằng Web Audio API (Không cần tải file âm thanh ngoài)

class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.volume = 0.6;
        this.initStorage();
    }

    initStorage() {
        const saved = localStorage.getItem('monopoly_sound_muted');
        if (saved !== null) {
            this.isMuted = JSON.parse(saved);
        }
    }

    ensureContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('monopoly_sound_muted', JSON.stringify(this.isMuted));
        return this.isMuted;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.3) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(gainVal * this.volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }

    playClick() {
        this.playTone(800, 'triangle', 0.05, 0.2);
    }

    playDiceRoll() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        // Âm thanh xúc xắc lăn lách cách
        const clicks = 6;
        for (let i = 0; i < clicks; i++) {
            setTimeout(() => {
                const freq = 200 + Math.random() * 400;
                this.playTone(freq, 'triangle', 0.04, 0.25);
            }, i * 50);
        }
    }

    playStep() {
        // Tiếng bước chân token nhảy ô
        this.playTone(520, 'sine', 0.06, 0.2);
    }

    playBuy() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        // Tiếng đếm tiền/mua bất động sản "Kaching"
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.12, 0.3);
            }, idx * 60);
        });
    }

    playRent() {
        // Tiếng trả tiền thuê
        this.playTone(330, 'triangle', 0.08, 0.2);
        setTimeout(() => this.playTone(280, 'triangle', 0.12, 0.25), 80);
    }

    playCardDraw() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        // Tiếng lật thẻ bài
        this.playTone(400, 'sine', 0.05, 0.15);
        setTimeout(() => this.playTone(600, 'sine', 0.08, 0.2), 40);
        setTimeout(() => this.playTone(800, 'sine', 0.1, 0.25), 80);
    }

    playJail() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        // Tiếng đóng sầm cửa tù / còi báo động
        this.playTone(150, 'sawtooth', 0.3, 0.4);
        setTimeout(() => this.playTone(110, 'sawtooth', 0.4, 0.5), 150);
    }

    playUnjail() {
        // Tiếng chuông thoát tù
        const notes = [440, 554.37, 659.25];
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.15, 0.3), idx * 80);
        });
    }

    playBankruptcy() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        // Tiếng vỡ nợ tụt dốc
        const notes = [300, 260, 220, 180, 140];
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'sawtooth', 0.2, 0.35), idx * 120);
        });
    }

    playFanfare() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        // Nhạc chiến thắng hào hùng
        const melody = [
            { f: 523.25, d: 0.15 },
            { f: 523.25, d: 0.15 },
            { f: 523.25, d: 0.15 },
            { f: 523.25, d: 0.4 },
            { f: 415.30, d: 0.4 },
            { f: 466.16, d: 0.4 },
            { f: 523.25, d: 0.6 }
        ];
        let time = 0;
        melody.forEach(item => {
            setTimeout(() => {
                this.playTone(item.f, 'triangle', item.d, 0.35);
            }, time * 1000);
            time += item.d + 0.05;
        });
    }
}

export const sound = new AudioManager();
