// ==============================================================================
// 1. HỆ THỐNG QUẢN LÝ TRACKING TẬP TRUNG (GTM) VÀ DYNAMIC SEO 
// ==============================================================================
(function setupSEOAndTracking() {
    
    // ---------------------------------------------------------
    // Paste GOOGLE TAG MANAGER (GTM) CODE BELOW


    // END OF GOOGLE TAG MANAGER (GTM) CODE
    // ---------------------------------------------------------


    // ---------------------------------------------------------
    // DYNAMIC META TAGS SYSTEM
    // ---------------------------------------------------------
    window.addEventListener('DOMContentLoaded', () => {
        const siteName = "Mera AI";
        
        // A. XỬ LÝ TITLE: Nếu file HTML chưa viết <title>, tự lấy thẻ <h1> làm title
        let title = document.title;
        if (!title || title === '' || title === 'Document') {
            const h1 = document.querySelector('h1');
            title = h1 ? `${h1.innerText.trim()} | ${siteName}` : siteName;
            document.title = title;
        }

        // B. XỬ LÝ DESCRIPTION: Ưu tiên thẻ meta có sẵn, nếu không có thì tự sinh ra
        let descMeta = document.querySelector('meta[name="description"]');
        let description = descMeta ? descMeta.getAttribute('content') : '';

        // TỰ ĐỘNG SINH DESCRIPTION CHO TRANG BLOG/ARTICLE
        if (!description) {
            const firstParagraph = document.querySelector('p');
            if (firstParagraph) {
                description = firstParagraph.innerText.substring(0, 150).trim() + '...';
            } else {
                description = "Mera AI - Empowering global connectivity with robust network infrastructure and cutting-edge solutions."; // Text mặc định
            }
            
            // Ép thẻ meta description mới vào HTML
            descMeta = document.createElement('meta');
            descMeta.name = "description";
            descMeta.content = description;
            document.head.appendChild(descMeta);
        }

        // C. LOGIC TỰ ĐỘNG BỐC ẢNH ĐẦU TIÊN CỦA BÀI VIẾT LÀM OG:IMAGE
        let finalImageUrl = '';
        
        // Tìm tất cả các thẻ hình ảnh xuất hiện trong trang
        const allImages = document.querySelectorAll('img');
        
        for (let img of allImages) {
            const src = img.getAttribute('src');
            if (!src) continue;
            
            // THÔNG MINH: Bỏ qua các ảnh thuộc về hệ thống dùng chung (Logo ở Header/Footer)
            if (src.includes('logo.png') || src.includes('logo-icon.png')) {
                continue; 
            }
            
            // Lấy tấm ảnh hợp lệ đầu tiên tìm được (thường là ảnh đại diện hoặc ảnh đầu bài viết)
            finalImageUrl = img.src; 
            break; // Tìm thấy ảnh đầu tiên rồi thì dừng vòng lặp ngay
        }

        // NẾU TRANG KHÔNG CÓ ẢNH (Hoặc các trang tĩnh): Tự động lấy ảnh banner mặc định của công ty
        if (!finalImageUrl) {
            finalImageUrl = new URL(`${root}images/default-share.jpg`, window.location.href).href;
        }

        // D. ÉP CÁC THẺ OPEN GRAPH CHUẨN VÀO HEAD
        const ogTags = {
            'og:title': title,
            'og:description': description,
            'og:type': 'website',
            'og:url': window.location.href,
            'og:site_name': siteName,
            'og:image': finalImageUrl
        };

        for (let property in ogTags) {
            if (!document.querySelector(`meta[property="${property}"]`)) {
                const meta = document.createElement('meta');
                meta.setAttribute('property', property);
                meta.setAttribute('content', ogTags[property]);
                document.head.appendChild(meta);
            }
        }
    });
})();


async function loadComponents() {
    // Lấy biến ROOT_PATH từ trang HTML hiện tại, nếu không có mặc định là thư mục gốc './'
    const root = window.ROOT_PATH || './';
    const commonDir = root + 'common/';

    try {
        // Tải Header
        if (document.getElementById('header-placeholder')) {
            let res = await fetch(commonDir + 'header.html');
            let html = await res.text();
            document.getElementById('header-placeholder').innerHTML = html.replace(/\[ROOT\]/g, root);
        }
        // Tải Footer
        if (document.getElementById('footer-placeholder')) {
            let res = await fetch(commonDir + 'footer.html');
            let html = await res.text();
            document.getElementById('footer-placeholder').innerHTML = html.replace(/\[ROOT\]/g, root);
        }
        // Tải Connect
        if (document.getElementById('connect-placeholder')) {
            let res = await fetch(commonDir + 'connect.html');
            let html = await res.text();
            document.getElementById('connect-placeholder').innerHTML = html.replace(/\[ROOT\]/g, root);
        }
        // Gọi lại các hàm chức năng sau khi giao diện đã render xong
        initCommonScripts();
    } catch (error) {
        console.error("Lỗi tải giao diện chung:", error);
    }
}

function initCommonScripts() {
    // 1. Script Đóng menu Mobile
    document.addEventListener('click', function(event) {
        const menuToggle = document.getElementById('menu-toggle');
        const navMenu = document.querySelector('.main-nav');
        const menuButton = document.querySelector('.mobile-menu-btn');
        
        if (!menuToggle || !navMenu || !menuButton) return;
        if (menuButton.contains(event.target) || event.target === menuToggle) return;
        if (menuToggle.checked) {
            if (!navMenu.contains(event.target) || event.target.tagName.toLowerCase() === 'a') {
                menuToggle.checked = false;
            }
        }
    });

    // 2. Script Gửi Form Contact
    const form = document.getElementById('meraContactForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const btn = this.querySelector('button[type="submit"]');
            const feedback = document.getElementById('formFeedback');
            const payload = {
                Full_Name: document.getElementById('fName').value,
                Email_Address: document.getElementById('fEmail').value,
                Phone_Number: document.getElementById('fPhone').value,
                Company_Name: document.getElementById('fCompany').value,
                Message: document.getElementById('fMessage').value
            };

            btn.disabled = true; btn.innerText = 'Sending...'; btn.style.opacity = '0.7';

            fetch('https://script.google.com/macros/s/AKfycbwCiQL49uXKmkslLKC4O6SFTk5Ilu4S1wWwhzYf4gvpknQ6WZFP7OPi83qvcOa33No/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if(response.ok) {
                    feedback.innerText = "Thanks for submit your information";
                    feedback.style.color = "#ffffff"; feedback.style.display = "block";
                    this.reset();
                } else throw new Error('Error');
            })
            .catch(() => {
                feedback.innerText = "Error sending message. Please try again.";
                feedback.style.color = "#ff3333"; feedback.style.display = "block";
            })
            .finally(() => {
                btn.disabled = false; btn.innerText = 'Send'; btn.style.opacity = '1';
                setTimeout(() => { feedback.style.display = "none"; }, 5000);
            });
        });
    }
}

// Chạy tự động khi load trang
document.addEventListener('DOMContentLoaded', loadComponents);


// ==============================================================================
// XỬ LÝ ĐIỀU HƯỚNG CONTACT THÔNG MINH CHO TẤT CẢ CÁC TRANG (KIẾN TRÚC PHÂN TÁN)
// Dán đè đoạn này vào phần xử lý cuộn trang ở cuối file common/main.js
// ==============================================================================

window.addEventListener('load', () => {
    // Đợi 500ms để Header và các nội dung phân tán được fetch xong hoàn toàn
    setTimeout(() => {
        
        // Hàm tính toán tọa độ và cuộn mượt chừa ra 100px Header
        function smoothScrollToTarget(targetElement) {
            if (!targetElement) return;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - 100; // Trừ độ cao Header
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }

        // 1. XỬ LÝ SỰ KIỆN CLICK NÚT CONTACT TRÊN MENU / FOOTER Ở TẤT CẢ CÁC TRANG
        const contactLinks = document.querySelectorAll('a[href*="connect-section"], a[href*="connect-placeholder"]');
        
        contactLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Kiểm tra xem trang hiện tại có khối connect-placeholder hoặc form contact thực tế hay không
                const hasConnectSection = document.getElementById('meraContactForm') || document.getElementById('connect-placeholder')?.innerHTML.trim() !== '';
                const connectArea = document.getElementById('connect-placeholder');

                if (hasConnectSection && connectArea) {
                    // TRƯỜNG HỢP 1: Trang hiện tại CÓ khối Connect -> Cuộn tại chỗ mượt mà
                    e.preventDefault(); 
                    smoothScrollToTarget(connectArea);
                    
                    // Đóng menu mobile (nếu đang mở)
                    const menuToggle = document.getElementById('menu-toggle');
                    if (menuToggle && menuToggle.checked) menuToggle.checked = false;
                } else {
                    // TRƯỜNG HỢP 2: Trang hiện tại KHÔNG CÓ khối Connect -> Cho phép bay về trang chủ kèm dấu #
                    // Sử dụng biến window.ROOT_PATH để tính đường dẫn chuẩn quay về gốc index.html
                    const root = window.ROOT_PATH || './';
                    this.href = `${root}index.html#connect-section`;
                    // Trình duyệt sẽ tự động chuyển hướng theo href mới này
                }
            });
        });

        // 2. XỬ LÝ SAU KHI CHUYỂN HƯỚNG (User từ trang khác bay về Trang Chủ có dấu #)
        if (window.location.hash === '#connect-section') {
            // Đợi thêm 200ms cho trang chủ ổn định DOM rồi bắt đầu cuộn
            setTimeout(() => {
                const targetBlock = document.getElementById('connect-placeholder');
                if (targetBlock) {
                    smoothScrollToTarget(targetBlock);
                }
            }, 200);
        }

    }, 500); 
});