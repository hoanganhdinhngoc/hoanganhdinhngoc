// js/dice.js
// Quản lý và render hiệu ứng Đổ Xúc Xắc 3D

import { sound } from './audio.js';

export class DiceManager {
    constructor() {
        this.isRolling = false;
        this.die1El = null;
        this.die2El = null;
    }

    initElements() {
        this.die1El = document.getElementById('die-1');
        this.die2El = document.getElementById('die-2');
    }

    // Góc xoay 3D tương ứng cho từng mặt từ 1 đến 6
    getRotationForValue(value) {
        switch (value) {
            case 1: return { x: 0, y: 0 };
            case 2: return { x: 0, y: -90 };
            case 3: return { x: 0, y: -180 };
            case 4: return { x: 0, y: 90 };
            case 5: return { x: -90, y: 0 };
            case 6: return { x: 90, y: 0 };
            default: return { x: 0, y: 0 };
        }
    }

    async roll(speed = 'normal') {
        if (this.isRolling) return null;
        this.isRolling = true;

        if (!this.die1El || !this.die2El) {
            this.initElements();
        }

        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        const isDouble = (die1 === die2);
        const total = die1 + die2;

        sound.playDiceRoll();

        let animDuration = 800;
        if (speed === 'fast') animDuration = 350;
        if (speed === 'instant') animDuration = 50;

        if (this.die1El && this.die2El) {
            // Thêm class lắc 3D
            this.die1El.classList.add('rolling');
            this.die2El.classList.add('rolling');

            // Hiệu ứng xoay ngẫu nhiên nhiều vòng
            const extraRotX1 = (Math.floor(Math.random() * 3) + 2) * 360;
            const extraRotY1 = (Math.floor(Math.random() * 3) + 2) * 360;
            const extraRotX2 = (Math.floor(Math.random() * 3) + 2) * 360;
            const extraRotY2 = (Math.floor(Math.random() * 3) + 2) * 360;

            const target1 = this.getRotationForValue(die1);
            const target2 = this.getRotationForValue(die2);

            this.die1El.style.transform = `rotateX(${target1.x + extraRotX1}deg) rotateY(${target1.y + extraRotY1}deg)`;
            this.die2El.style.transform = `rotateX(${target2.x + extraRotX2}deg) rotateY(${target2.y + extraRotY2}deg)`;

            await new Promise(resolve => setTimeout(resolve, animDuration));

            this.die1El.classList.remove('rolling');
            this.die2El.classList.remove('rolling');

            // Định vị chính xác mặt hiển thị cuối cùng
            this.die1El.style.transform = `rotateX(${target1.x}deg) rotateY(${target1.y}deg)`;
            this.die2El.style.transform = `rotateX(${target2.x}deg) rotateY(${target2.y}deg)`;
        }

        this.isRolling = false;
        return { die1, die2, total, isDouble };
    }
}

export const dice = new DiceManager();
