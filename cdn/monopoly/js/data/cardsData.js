// js/data/cardsData.js
// Danh sách đầy đủ 16 Thẻ Khí Vận (Chance) và 16 Thẻ Cơ Hội (Community Chest)

export const CHANCE_CARDS = [
    {
        id: 'chance_1',
        title: 'Tiến về Bắt Đầu (GO)',
        text: 'Tiến thẳng về ô Bắt Đầu (GO). Nhận ngay $200.',
        action: 'ADVANCE_TO',
        tileId: 0
    },
    {
        id: 'chance_2',
        title: 'Tiến đến Đại Lộ Illinois',
        text: 'Tiến đến Đại Lộ Illinois. Nếu đi qua ô Bắt Đầu, nhận $200.',
        action: 'ADVANCE_TO',
        tileId: 24
    },
    {
        id: 'chance_3',
        title: 'Tiến đến Quảng Trường St. Charles',
        text: 'Tiến đến Quảng Trường St. Charles. Nếu đi qua ô Bắt Đầu, nhận $200.',
        action: 'ADVANCE_TO',
        tileId: 11
    },
    {
        id: 'chance_4',
        title: 'Đến Tiện Ích Gần Nhất',
        text: 'Tiến đến Công Ty Tiện Ích gần nhất. Nếu chưa có chủ, bạn có thể mua từ Ngân Hàng. Nếu đã có chủ, tung xúc xắc và trả gấp 10 lần số điểm vừa tung.',
        action: 'ADVANCE_TO_NEAREST_UTILITY'
    },
    {
        id: 'chance_5',
        title: 'Đến Ga Xe Lửa Gần Nhất',
        text: 'Tiến đến Ga Xe Lửa gần nhất. Nếu chưa có chủ, bạn có thể mua. Nếu đã có chủ, trả gấp đôi tiền thuê thông thường.',
        action: 'ADVANCE_TO_NEAREST_RR'
    },
    {
        id: 'chance_6',
        title: 'Cổ Tức Ngân Hàng',
        text: 'Ngân Hàng chi trả cổ tức cho bạn. Nhận $50.',
        action: 'COLLECT_MONEY',
        amount: 50
    },
    {
        id: 'chance_7',
        title: 'Thẻ Ra Tù Miễn Phí',
        text: 'Thẻ này có thể giữ lại để sử dụng khi vào tù hoặc bán/giao dịch cho người chơi khác.',
        action: 'GET_OUT_OF_JAIL_FREE'
    },
    {
        id: 'chance_8',
        title: 'Lùi Lại 3 Bước',
        text: 'Đi lùi lại 3 ô trên bàn cờ.',
        action: 'GO_BACK_SPACES',
        spaces: 3
    },
    {
        id: 'chance_9',
        title: 'Vào Tù Ngay',
        text: 'Đi thẳng vào Tù. Không đi qua ô Bắt Đầu, không nhận $200.',
        action: 'GO_TO_JAIL'
    },
    {
        id: 'chance_10',
        title: 'Sửa Chữa Bất Động Sản',
        text: 'Sửa chữa tất cả bất động sản của bạn: Nộp $25 cho mỗi căn nhà và $100 cho mỗi khách sạn.',
        action: 'PROPERTY_REPAIRS',
        houseCost: 25,
        hotelCost: 100
    },
    {
        id: 'chance_11',
        title: 'Phạt Chạy Quá Tốc Độ',
        text: 'Nộp phạt vi phạm giao thông quá tốc độ $15.',
        action: 'PAY_MONEY',
        amount: 15
    },
    {
        id: 'chance_12',
        title: 'Chuyến Đi Đến Ga Reading',
        text: 'Tiến đến Ga Xe Lửa Reading. Nếu đi qua ô Bắt Đầu, nhận $200.',
        action: 'ADVANCE_TO',
        tileId: 5
    },
    {
        id: 'chance_13',
        title: 'Dạo Bước Phố Boardwalk',
        text: 'Tiến thẳng đến Phố Đi Bộ Boardwalk.',
        action: 'ADVANCE_TO',
        tileId: 39
    },
    {
        id: 'chance_14',
        title: 'Bầu Cử Chủ Tịch Hội Đồng',
        text: 'Bạn được bầu làm Chủ tịch Hội đồng Quản trị. Trả cho mỗi người chơi $50.',
        action: 'PAY_EACH_PLAYER',
        amount: 50
    },
    {
        id: 'chance_15',
        title: 'Đáo Hạn Khoản Vay',
        text: 'Khoản tiết kiệm của bạn đáo hạn. Nhận ngay $150 từ Ngân Hàng.',
        action: 'COLLECT_MONEY',
        amount: 150
    },
    {
        id: 'chance_16',
        title: 'Giải Nhất Xổ Số',
        text: 'Bạn trúng giải thưởng tuần hoàn. Nhận $100.',
        action: 'COLLECT_MONEY',
        amount: 100
    }
];

export const COMMUNITY_CHEST_CARDS = [
    {
        id: 'chest_1',
        title: 'Tiến về Bắt Đầu (GO)',
        text: 'Tiến thẳng về ô Bắt Đầu (GO). Nhận $200.',
        action: 'ADVANCE_TO',
        tileId: 0
    },
    {
        id: 'chest_2',
        title: 'Lỗi Sao Kê Ngân Hàng',
        text: 'Ngân Hàng nhầm lẫn có lợi cho bạn. Nhận $200.',
        action: 'COLLECT_MONEY',
        amount: 200
    },
    {
        id: 'chest_3',
        title: 'Chi Phí Bác Sĩ',
        text: 'Nộp viện phí khám bệnh $50.',
        action: 'PAY_MONEY',
        amount: 50
    },
    {
        id: 'chest_4',
        title: 'Bán Cổ Phiếu',
        text: 'Bán cổ phiếu thu lãi. Nhận $50.',
        action: 'COLLECT_MONEY',
        amount: 50
    },
    {
        id: 'chest_5',
        title: 'Thẻ Ra Tù Miễn Phí',
        text: 'Thẻ này có thể giữ lại để sử dụng khi vào tù hoặc bán/giao dịch cho người chơi khác.',
        action: 'GET_OUT_OF_JAIL_FREE'
    },
    {
        id: 'chest_6',
        title: 'Vào Tù Ngay',
        text: 'Đi thẳng vào Tù. Không đi qua ô Bắt Đầu, không nhận $200.',
        action: 'GO_TO_JAIL'
    },
    {
        id: 'chest_7',
        title: 'Đêm Ca Nhạc Khai Mạc',
        text: 'Đêm hòa nhạc gây quỹ thành công. Nhận từ mỗi người chơi $50.',
        action: 'COLLECT_FROM_EACH',
        amount: 50
    },
    {
        id: 'chest_8',
        title: 'Hoàn Thuế Thu Nhập',
        text: 'Nhận tiền hoàn trả thuế thu nhập $20.',
        action: 'COLLECT_MONEY',
        amount: 20
    },
    {
        id: 'chest_9',
        title: 'Mừng Sinh Nhật',
        text: 'Hôm nay là sinh nhật bạn! Nhận từ mỗi người chơi $10 quà tặng.',
        action: 'COLLECT_FROM_EACH',
        amount: 10
    },
    {
        id: 'chest_10',
        title: 'Bảo Hiểm Nhân Thọ Đáo Hạn',
        text: 'Bảo hiểm nhân thọ của bạn đáo hạn. Nhận $100.',
        action: 'COLLECT_MONEY',
        amount: 100
    },
    {
        id: 'chest_11',
        title: 'Nộp Phí Bệnh Viện',
        text: 'Nộp viện phí $100 cho bệnh viện tư.',
        action: 'PAY_MONEY',
        amount: 100
    },
    {
        id: 'chest_12',
        title: 'Học Phí Đại Học',
        text: 'Thanh toán tiền học phí $50 cho con bạn.',
        action: 'PAY_MONEY',
        amount: 50
    },
    {
        id: 'chest_13',
        title: 'Nhận Phí Tư Vấn',
        text: 'Nhận thù lao tư vấn tài chính $25.',
        action: 'COLLECT_MONEY',
        amount: 25
    },
    {
        id: 'chest_14',
        title: 'Tu Sửa Đường Phố',
        text: 'Nộp phạt bảo trì đường phố: $40 cho mỗi căn nhà, $115 cho mỗi khách sạn sở hữu.',
        action: 'PROPERTY_REPAIRS',
        houseCost: 40,
        hotelCost: 115
    },
    {
        id: 'chest_15',
        title: 'Giải Nhì Người Đẹp',
        text: 'Bạn đoạt giải Nhì trong cuộc thi Sắc Đẹp. Nhận $10.',
        action: 'COLLECT_MONEY',
        amount: 10
    },
    {
        id: 'chest_16',
        title: 'Thừa Kế Tài Sản',
        text: 'Bạn được thừa kế khoản tiền $100 từ họ hàng xa.',
        action: 'COLLECT_MONEY',
        amount: 100
    }
];
