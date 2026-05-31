# Mera Blog System - Static Site Generation

## 📋 Tổng Quan

Hệ thống blog tự động hóa 100% dựa trên Notion CMS + Quartz 4 + GitHub Actions.
Tất cả code được chứa trong folder này, sẵn sàng copy sang repo production mà không cần cập nhật paths.

## 📁 Cấu Trúc Thư Mục

```
blog/
├── index.html                 (Trang danh sách bài viết)
├── blog-list.json             (Index tự động sinh từ Notion)
├── articles/                  (Bài viết HTML tĩnh - tự động sinh)
│   ├── bai-viet-so-1.html
│   ├── bai-viet-so-2.html
│   └── ...
├── _scripts/
│   ├── fetch-notion.js        (Quét Notion Database)
│   ├── build-blog.js          (Quartz 4 - Build Markdown → HTML)
│   ├── generate-index.js      (Tạo blog-list.json)
│   └── notion-sync.mjs        (ESM module - Xử lý API Notion)
├── _styles/
│   ├── blog-theme.css         (Theme chính của blog)
│   └── responsive.css         (Mobile/Tablet responsive)
├── _components/
│   ├── blog-card.html         (Template card bài viết)
│   ├── filter-sidebar.html    (Component filter & search)
│   └── table-of-contents.html (TOC component)
└── config.json                (Cấu hình Notion API & Build)
```

## 🔧 Cấu Hình Ban Đầu

### Bước 1: Notion Database Setup

Database cần có các fields:
- `title` (Text) - Tiêu đề bài viết
- `slugs` (Text) - URL slug (ví dụ: "bai-viet-so-1")
- `tags` (Multi-select) - Tags phụ
- `category` (Select) - Danh mục chính
- `public-date` (Date) - Ngày xuất bản
- `keywords` (Multi-select) - SEO keywords
- `published` (Checkbox) - Trạng thái công khai (✓ = publish)

### Bước 2: GitHub Secrets Setup

Cần thêm vào GitHub Actions Secrets:
```
NOTION_API_KEY=<Your Notion API Key>
NOTION_DATABASE_ID=<Your Database ID>
GITHUB_TOKEN=<Personal Access Token>
```

### Bước 3: GitHub Actions Workflow

File: `.github/workflows/sync-notion-blog.yml`
- Trigger: Khi bấm "Publish" trên Notion
- Hoặc: Chạy thủ công qua GitHub Actions UI

## 🚀 Workflow Tự Động

1. **User viết bài trên Notion** → Bấm "Publish" (Checkbox)
2. **GitHub Webhook kích hoạt** → Trigger GitHub Action
3. **Action chạy script**:
   - Quét Notion API lấy bài mới
   - Chuyển đổi Notion blocks → Markdown
   - Build Markdown → HTML bằng Quartz 4
   - Tạo `blog-list.json` index
4. **Auto commit & push** lên folder `articles/`
5. **Blog index page tự động update** danh sách

## 📝 URL Structure

**Trang danh sách**: `meraai.com/blog/`
**Bài viết**: `meraai.com/blog/articles/<slug>`

Ví dụ: `meraai.com/blog/articles/bai-viet-so-1`

## 🎯 Tính Năng

✅ Search toàn bộ bài viết
✅ Filter theo Category
✅ Filter theo Tags
✅ Sort theo ngày / tiêu đề
✅ Table of Contents (TOC) trong bài viết
✅ SEO optimization (Meta tags, Schema.org)
✅ Responsive grid (4 cột desktop → 1 cột mobile)
✅ Relative paths (copy folder anywhere)

## 📖 Hướng Dẫn Sử Dụng

### Tạo bài viết mới:
1. Vào Notion Database → Thêm row mới
2. Điền thông tin: title, slugs, category, tags
3. Viết nội dung trong Notion page
4. Bấm checkbox "published" → Auto trigger workflow
5. Chờ ~2-3 phút → Bài viết xuất hiện trên blog

### Cập nhật bài viết:
1. Chỉnh sửa nội dung trên Notion
2. Save → Webhook tự động quét lại
3. Bài viết cập nhật trên blog

## 🔐 API Keys Management

**⚠️ IMPORTANT - NEVER COMMIT API KEYS TO GIT**

Tất cả API keys được quản lý qua GitHub Secrets.
Không có hardcode key trong source code.

## 📚 Tài Liệu Tham Khảo

- [Notion API Documentation](https://developers.notion.com/)
- [Quartz 4 Documentation](https://quartz.jzhao.xyz/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
