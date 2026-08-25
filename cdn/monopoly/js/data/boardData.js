// js/data/boardData.js
// Dữ liệu chuẩn 40 ô của bàn cờ Cờ Tỷ Phú (Classic Monopoly)

export const COLOR_GROUPS = {
    BROWN: { id: 'BROWN', name: 'Nâu', hex: '#8B4513', houseCost: 50 },
    LIGHT_BLUE: { id: 'LIGHT_BLUE', name: 'Xanh Da Trời', hex: '#87CEEB', houseCost: 50 },
    PINK: { id: 'PINK', name: 'Hồng', hex: '#D81B60', houseCost: 100 },
    ORANGE: { id: 'ORANGE', name: 'Cam', hex: '#FF9800', houseCost: 100 },
    RED: { id: 'RED', name: 'Đỏ', hex: '#E53935', houseCost: 150 },
    YELLOW: { id: 'YELLOW', name: 'Vàng', hex: '#FDD835', houseCost: 150 },
    GREEN: { id: 'GREEN', name: 'Xanh Lá', hex: '#43A047', houseCost: 200 },
    DARK_BLUE: { id: 'DARK_BLUE', name: 'Xanh Đậm', hex: '#1E3A8A', houseCost: 200 },
    RAILROAD: { id: 'RAILROAD', name: 'Ga Xe Lửa', hex: '#263238', houseCost: 0 },
    UTILITY: { id: 'UTILITY', name: 'Tiện Ích', hex: '#455A64', houseCost: 0 },
    SPECIAL: { id: 'SPECIAL', name: 'Đặc Biệt', hex: '#9E9E9E', houseCost: 0 }
};

export const BOARD_TILES = [
    // 0: GO (Góc dưới cùng bên phải)
    {
        id: 0,
        name: 'Bắt Đầu (GO)',
        type: 'GO',
        group: 'SPECIAL',
        color: '#E0E7FF',
        icon: 'fa-solid fa-arrow-right',
        description: 'Nhận $200 khi đi qua hoặc đáp trúng ô này.',
        grid: { row: 11, col: 11 }
    },
    // 1: Mediterranean Avenue
    {
        id: 1,
        name: 'Đại Lộ Địa Trung Hải',
        shortName: 'Địa Trung Hải',
        type: 'PROPERTY',
        group: 'BROWN',
        price: 60,
        rent: [2, 10, 30, 90, 160, 250], // [Base, 1 House, 2 Houses, 3 Houses, 4 Houses, Hotel]
        houseCost: 50,
        mortgageValue: 30,
        unmortgageCost: 33,
        grid: { row: 11, col: 10 }
    },
    // 2: Community Chest
    {
        id: 2,
        name: 'Cơ Hội',
        type: 'CHEST',
        group: 'SPECIAL',
        icon: 'fa-solid fa-box-open',
        description: 'Rút 1 thẻ Cơ Hội.',
        grid: { row: 11, col: 9 }
    },
    // 3: Baltic Avenue
    {
        id: 3,
        name: 'Đại Lộ Baltic',
        shortName: 'Baltic',
        type: 'PROPERTY',
        group: 'BROWN',
        price: 60,
        rent: [4, 20, 60, 180, 320, 450],
        houseCost: 50,
        mortgageValue: 30,
        unmortgageCost: 33,
        grid: { row: 11, col: 8 }
    },
    // 4: Income Tax
    {
        id: 4,
        name: 'Thuế Thu Nhập',
        type: 'TAX',
        group: 'SPECIAL',
        taxAmount: 200,
        icon: 'fa-solid fa-receipt',
        description: 'Nộp phạt thuế $200 cho Ngân Hàng.',
        grid: { row: 11, col: 7 }
    },
    // 5: Reading Railroad
    {
        id: 5,
        name: 'Ga Xe Lửa Reading',
        shortName: 'Ga Reading',
        type: 'RAILROAD',
        group: 'RAILROAD',
        price: 200,
        rent: [25, 50, 100, 200], // Theo số ga sở hữu: 1, 2, 3, 4
        mortgageValue: 100,
        unmortgageCost: 110,
        icon: 'fa-solid fa-train',
        grid: { row: 11, col: 6 }
    },
    // 6: Oriental Avenue
    {
        id: 6,
        name: 'Đại Lộ Phương Đông',
        shortName: 'Phương Đông',
        type: 'PROPERTY',
        group: 'LIGHT_BLUE',
        price: 100,
        rent: [6, 30, 90, 270, 400, 550],
        houseCost: 50,
        mortgageValue: 50,
        unmortgageCost: 55,
        grid: { row: 11, col: 5 }
    },
    // 7: Chance
    {
        id: 7,
        name: 'Khí Vận',
        type: 'CHANCE',
        group: 'SPECIAL',
        icon: 'fa-solid fa-question',
        description: 'Rút 1 thẻ Khí Vận.',
        grid: { row: 11, col: 4 }
    },
    // 8: Vermont Avenue
    {
        id: 8,
        name: 'Đại Lộ Vermont',
        shortName: 'Vermont',
        type: 'PROPERTY',
        group: 'LIGHT_BLUE',
        price: 100,
        rent: [6, 30, 90, 270, 400, 550],
        houseCost: 50,
        mortgageValue: 50,
        unmortgageCost: 55,
        grid: { row: 11, col: 3 }
    },
    // 9: Connecticut Avenue
    {
        id: 9,
        name: 'Đại Lộ Connecticut',
        shortName: 'Connecticut',
        type: 'PROPERTY',
        group: 'LIGHT_BLUE',
        price: 120,
        rent: [8, 40, 100, 300, 450, 600],
        houseCost: 50,
        mortgageValue: 60,
        unmortgageCost: 66,
        grid: { row: 11, col: 2 }
    },
    // 10: In Jail / Just Visiting (Góc dưới cùng bên trái)
    {
        id: 10,
        name: 'Thăm Tù / Trong Tù',
        type: 'JAIL',
        group: 'SPECIAL',
        icon: 'fa-solid fa-lock',
        description: 'Nếu đi qua chỉ là Thăm Tù. Nếu bị bắt sẽ phải ở Trong Tù.',
        grid: { row: 11, col: 1 }
    },
    // 11: St. Charles Place
    {
        id: 11,
        name: 'Quảng Trường St. Charles',
        shortName: 'St. Charles',
        type: 'PROPERTY',
        group: 'PINK',
        price: 140,
        rent: [10, 50, 150, 450, 625, 750],
        houseCost: 100,
        mortgageValue: 70,
        unmortgageCost: 77,
        grid: { row: 10, col: 1 }
    },
    // 12: Electric Company
    {
        id: 12,
        name: 'Công Ty Điện Lực',
        shortName: 'Điện Lực',
        type: 'UTILITY',
        group: 'UTILITY',
        price: 150,
        mortgageValue: 75,
        unmortgageCost: 83,
        icon: 'fa-solid fa-bolt',
        description: 'Thuê gấp 4 lần xúc xắc (1 cơ sở) hoặc 10 lần (2 cơ sở).',
        grid: { row: 9, col: 1 }
    },
    // 13: States Avenue
    {
        id: 13,
        name: 'Đại Lộ States',
        shortName: 'States',
        type: 'PROPERTY',
        group: 'PINK',
        price: 140,
        rent: [10, 50, 150, 450, 625, 750],
        houseCost: 100,
        mortgageValue: 70,
        unmortgageCost: 77,
        grid: { row: 8, col: 1 }
    },
    // 14: Virginia Avenue
    {
        id: 14,
        name: 'Đại Lộ Virginia',
        shortName: 'Virginia',
        type: 'PROPERTY',
        group: 'PINK',
        price: 160,
        rent: [12, 60, 180, 500, 700, 900],
        houseCost: 100,
        mortgageValue: 80,
        unmortgageCost: 88,
        grid: { row: 7, col: 1 }
    },
    // 15: Pennsylvania Railroad
    {
        id: 15,
        name: 'Ga Xe Lửa Pennsylvania',
        shortName: 'Ga Pennsylvania',
        type: 'RAILROAD',
        group: 'RAILROAD',
        price: 200,
        rent: [25, 50, 100, 200],
        mortgageValue: 100,
        unmortgageCost: 110,
        icon: 'fa-solid fa-train',
        grid: { row: 6, col: 1 }
    },
    // 16: St. James Place
    {
        id: 16,
        name: 'Quảng Trường St. James',
        shortName: 'St. James',
        type: 'PROPERTY',
        group: 'ORANGE',
        price: 180,
        rent: [14, 70, 200, 550, 750, 950],
        houseCost: 100,
        mortgageValue: 90,
        unmortgageCost: 99,
        grid: { row: 5, col: 1 }
    },
    // 17: Community Chest
    {
        id: 17,
        name: 'Cơ Hội',
        type: 'CHEST',
        group: 'SPECIAL',
        icon: 'fa-solid fa-box-open',
        description: 'Rút 1 thẻ Cơ Hội.',
        grid: { row: 4, col: 1 }
    },
    // 18: Tennessee Avenue
    {
        id: 18,
        name: 'Đại Lộ Tennessee',
        shortName: 'Tennessee',
        type: 'PROPERTY',
        group: 'ORANGE',
        price: 180,
        rent: [14, 70, 200, 550, 750, 950],
        houseCost: 100,
        mortgageValue: 90,
        unmortgageCost: 99,
        grid: { row: 3, col: 1 }
    },
    // 19: New York Avenue
    {
        id: 19,
        name: 'Đại Lộ New York',
        shortName: 'New York',
        type: 'PROPERTY',
        group: 'ORANGE',
        price: 200,
        rent: [16, 80, 220, 600, 800, 1000],
        houseCost: 100,
        mortgageValue: 100,
        unmortgageCost: 110,
        grid: { row: 2, col: 1 }
    },
    // 20: Free Parking (Góc trên cùng bên trái)
    {
        id: 20,
        name: 'Bãi Đỗ Xe Miễn Phí',
        type: 'PARKING',
        group: 'SPECIAL',
        icon: 'fa-solid fa-car',
        description: 'Nghỉ ngơi an toàn, không có phí.',
        grid: { row: 1, col: 1 }
    },
    // 21: Kentucky Avenue
    {
        id: 21,
        name: 'Đại Lộ Kentucky',
        shortName: 'Kentucky',
        type: 'PROPERTY',
        group: 'RED',
        price: 220,
        rent: [18, 90, 250, 700, 875, 1050],
        houseCost: 150,
        mortgageValue: 110,
        unmortgageCost: 121,
        grid: { row: 1, col: 2 }
    },
    // 22: Chance
    {
        id: 22,
        name: 'Khí Vận',
        type: 'CHANCE',
        group: 'SPECIAL',
        icon: 'fa-solid fa-question',
        description: 'Rút 1 thẻ Khí Vận.',
        grid: { row: 1, col: 3 }
    },
    // 23: Indiana Avenue
    {
        id: 23,
        name: 'Đại Lộ Indiana',
        shortName: 'Indiana',
        type: 'PROPERTY',
        group: 'RED',
        price: 220,
        rent: [18, 90, 250, 700, 875, 1050],
        houseCost: 150,
        mortgageValue: 110,
        unmortgageCost: 121,
        grid: { row: 1, col: 4 }
    },
    // 24: Illinois Avenue
    {
        id: 24,
        name: 'Đại Lộ Illinois',
        shortName: 'Illinois',
        type: 'PROPERTY',
        group: 'RED',
        price: 240,
        rent: [20, 100, 300, 750, 925, 1100],
        houseCost: 150,
        mortgageValue: 120,
        unmortgageCost: 132,
        grid: { row: 1, col: 5 }
    },
    // 25: B. & O. Railroad
    {
        id: 25,
        name: 'Ga Xe Lửa B. & O.',
        shortName: 'Ga B. & O.',
        type: 'RAILROAD',
        group: 'RAILROAD',
        price: 200,
        rent: [25, 50, 100, 200],
        mortgageValue: 100,
        unmortgageCost: 110,
        icon: 'fa-solid fa-train',
        grid: { row: 1, col: 6 }
    },
    // 26: Atlantic Avenue
    {
        id: 26,
        name: 'Đại Lộ Đại Tây Dương',
        shortName: 'Đại Tây Dương',
        type: 'PROPERTY',
        group: 'YELLOW',
        price: 260,
        rent: [22, 110, 330, 800, 975, 1150],
        houseCost: 150,
        mortgageValue: 130,
        unmortgageCost: 143,
        grid: { row: 1, col: 7 }
    },
    // 27: Ventnor Avenue
    {
        id: 27,
        name: 'Đại Lộ Ventnor',
        shortName: 'Ventnor',
        type: 'PROPERTY',
        group: 'YELLOW',
        price: 260,
        rent: [22, 110, 330, 800, 975, 1150],
        houseCost: 150,
        mortgageValue: 130,
        unmortgageCost: 143,
        grid: { row: 1, col: 8 }
    },
    // 28: Water Works
    {
        id: 28,
        name: 'Nhà Máy Nước',
        shortName: 'Nhà Máy Nước',
        type: 'UTILITY',
        group: 'UTILITY',
        price: 150,
        mortgageValue: 75,
        unmortgageCost: 83,
        icon: 'fa-solid fa-faucet-drip',
        description: 'Thuê gấp 4 lần xúc xắc (1 cơ sở) hoặc 10 lần (2 cơ sở).',
        grid: { row: 1, col: 9 }
    },
    // 29: Marvin Gardens
    {
        id: 29,
        name: 'Vườn Marvin',
        shortName: 'Marvin Gardens',
        type: 'PROPERTY',
        group: 'YELLOW',
        price: 280,
        rent: [24, 120, 360, 850, 1025, 1200],
        houseCost: 150,
        mortgageValue: 140,
        unmortgageCost: 154,
        grid: { row: 1, col: 10 }
    },
    // 30: Go to Jail (Góc trên cùng bên phải)
    {
        id: 30,
        name: 'Vào Tù Ngay',
        type: 'GO_TO_JAIL',
        group: 'SPECIAL',
        icon: 'fa-solid fa-handcuffs',
        description: 'Đi thẳng vào Tù, không đi qua GO, không nhận $200.',
        grid: { row: 1, col: 11 }
    },
    // 31: Pacific Avenue
    {
        id: 31,
        name: 'Đại Lộ Thái Bình Dương',
        shortName: 'Thái Bình Dương',
        type: 'PROPERTY',
        group: 'GREEN',
        price: 300,
        rent: [26, 130, 390, 900, 1100, 1275],
        houseCost: 200,
        mortgageValue: 150,
        unmortgageCost: 165,
        grid: { row: 2, col: 11 }
    },
    // 32: North Carolina Avenue
    {
        id: 32,
        name: 'Đại Lộ North Carolina',
        shortName: 'North Carolina',
        type: 'PROPERTY',
        group: 'GREEN',
        price: 300,
        rent: [26, 130, 390, 900, 1100, 1275],
        houseCost: 200,
        mortgageValue: 150,
        unmortgageCost: 165,
        grid: { row: 3, col: 11 }
    },
    // 33: Community Chest
    {
        id: 33,
        name: 'Cơ Hội',
        type: 'CHEST',
        group: 'SPECIAL',
        icon: 'fa-solid fa-box-open',
        description: 'Rút 1 thẻ Cơ Hội.',
        grid: { row: 4, col: 11 }
    },
    // 34: Pennsylvania Avenue
    {
        id: 34,
        name: 'Đại Lộ Pennsylvania',
        shortName: 'Pennsylvania',
        type: 'PROPERTY',
        group: 'GREEN',
        price: 320,
        rent: [28, 150, 450, 1000, 1200, 1400],
        houseCost: 200,
        mortgageValue: 160,
        unmortgageCost: 176,
        grid: { row: 5, col: 11 }
    },
    // 35: Short Line Railroad
    {
        id: 35,
        name: 'Ga Xe Lửa Short Line',
        shortName: 'Ga Short Line',
        type: 'RAILROAD',
        group: 'RAILROAD',
        price: 200,
        rent: [25, 50, 100, 200],
        mortgageValue: 100,
        unmortgageCost: 110,
        icon: 'fa-solid fa-train',
        grid: { row: 6, col: 11 }
    },
    // 36: Chance
    {
        id: 36,
        name: 'Khí Vận',
        type: 'CHANCE',
        group: 'SPECIAL',
        icon: 'fa-solid fa-question',
        description: 'Rút 1 thẻ Khí Vận.',
        grid: { row: 7, col: 11 }
    },
    // 37: Park Place
    {
        id: 37,
        name: 'Khu Park Place',
        shortName: 'Park Place',
        type: 'PROPERTY',
        group: 'DARK_BLUE',
        price: 350,
        rent: [35, 175, 500, 1100, 1300, 1500],
        houseCost: 200,
        mortgageValue: 175,
        unmortgageCost: 193,
        grid: { row: 8, col: 11 }
    },
    // 38: Luxury Tax
    {
        id: 38,
        name: 'Thuế Xa Xỉ',
        type: 'TAX',
        group: 'SPECIAL',
        taxAmount: 100,
        icon: 'fa-solid fa-gem',
        description: 'Nộp phạt thuế $100 cho Ngân Hàng.',
        grid: { row: 9, col: 11 }
    },
    // 39: Boardwalk
    {
        id: 39,
        name: 'Phố Đi Bộ Boardwalk',
        shortName: 'Boardwalk',
        type: 'PROPERTY',
        group: 'DARK_BLUE',
        price: 400,
        rent: [50, 200, 600, 1400, 1700, 2000],
        houseCost: 200,
        mortgageValue: 200,
        unmortgageCost: 220,
        grid: { row: 10, col: 11 }
    }
];

// Nhóm các ô Bất Động Sản theo nhóm màu
export const PROPERTY_GROUPS = {
    BROWN: [1, 3],
    LIGHT_BLUE: [6, 8, 9],
    PINK: [11, 13, 14],
    ORANGE: [16, 18, 19],
    RED: [21, 23, 24],
    YELLOW: [26, 27, 29],
    GREEN: [31, 32, 34],
    DARK_BLUE: [37, 39],
    RAILROAD: [5, 15, 25, 35],
    UTILITY: [12, 28]
};

// Thông tin hình tượng Token người chơi
export const TOKEN_CONFIGS = [
    { id: 'car', name: 'Siêu Xe', icon: 'fa-solid fa-car-side', color: '#EF4444' },
    { id: 'hat', name: 'Mũ Quý Tộc', icon: 'fa-solid fa-hat-wizard', color: '#3B82F6' },
    { id: 'ship', name: 'Chiến Hạm', icon: 'fa-solid fa-ship', color: '#10B981' },
    { id: 'dog', name: 'Cún Cưng', icon: 'fa-solid fa-dog', color: '#F59E0B' },
    { id: 'thimble', name: 'Vương Miện', icon: 'fa-solid fa-crown', color: '#8B5CF6' },
    { id: 'boot', name: 'Ủng Da', icon: 'fa-solid fa-shoe-prints', color: '#EC4899' }
];
