/**
 * Cloudflare Pages Function — Private R2 Manga Gateway
 * Route: /api/manga/*
 * Binding required in Cloudflare Pages Settings -> Bindings -> R2 bucket:
 *   Variable name: MANGA_BUCKET -> Bucket: manga-library
 */

const BOT_UA_REGEX = /bot|crawl|spider|slurp|mediapartners|adsbot|bingpreview|facebookexternalhit|python|curl|wget|aiohttp|httpx|go-http-client|java\/|okhttp|axios|node-fetch|headless|phantomjs|gptbot|chatgpt|claudebot|anthropic|bytespider|ccbot|perplexity|ahrefs|semrush|mj12bot|dotbot|petalbot|yandex|baiduspider|duckduckbot|ia_archiver|archive\.org|megaindex|blexbot|censys|shodan|zgrab|nmap|masscan|nuclei|dmca|copyright|scrapy|libwww|lwp-trivial/i;

const SECURITY_HEADERS = {
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate',
    'X-Content-Type-Options': 'nosniff',
};

function isAuthorizedRequest(request) {
    const ua = request.headers.get('User-Agent') || '';
    if (!ua || BOT_UA_REGEX.test(ua)) {
        return false;
    }

    // Block direct address-bar navigation to API URLs
    const secFetchMode = request.headers.get('Sec-Fetch-Mode') || '';
    if (secFetchMode === 'navigate') {
        return false;
    }

    // Check internal reader header or same-origin referer from /manga
    const clientKey = request.headers.get('X-Manga-Client') || '';
    if (clientKey === 'nier-reader-v1') {
        return true;
    }

    const secFetchSite = request.headers.get('Sec-Fetch-Site') || '';
    const referer = request.headers.get('Referer') || '';
    if (secFetchSite === 'same-origin' && referer.includes('/manga')) {
        return true;
    }

    return false;
}

function notFoundResponse() {
    return new Response('Not Found', {
        status: 404,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            ...SECURITY_HEADERS
        }
    });
}

function guessContentType(key) {
    const lower = key.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
    if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
    return 'application/octet-stream';
}

async function buildDynamicCatalog(bucket) {
    const listed = await bucket.list({ limit: 1000 });
    const folders = {};

    for (const obj of listed.objects) {
        const key = obj.key;
        const slashIdx = key.indexOf('/');
        if (slashIdx <= 0) continue;

        const folder = key.slice(0, slashIdx);
        const file = key.slice(slashIdx + 1);
        if (!file || folder.startsWith('.')) continue;

        if (!folders[folder]) {
            folders[folder] = {
                id: folder,
                title: folder.replace(/[-_]/g, ' '),
                author: '',
                year: '',
                thumbnail: null,
                pdfs: [],
                hasMeta: false
            };
        }

        const entry = folders[folder];
        if (/^thumbnail\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
            entry.thumbnail = `${folder}/${file}`;
        } else if (file.toLowerCase() === 'meta.txt') {
            entry.hasMeta = true;
        } else if (file.toLowerCase().endsWith('.pdf')) {
            entry.pdfs.push({
                name: file.replace(/\.pdf$/i, ''),
                file: `${folder}/${file}`,
                size: obj.size
            });
        }
    }

    const publications = Object.values(folders);
    await Promise.all(publications.map(async (pub) => {
        if (pub.hasMeta) {
            try {
                const metaObj = await bucket.get(`${pub.id}/meta.txt`);
                if (metaObj) {
                    const txt = await metaObj.text();
                    const lines = txt.split(/\r?\n/).map(l => l.trim());
                    if (lines[0]) pub.title = lines[0];
                    if (lines[1]) pub.author = lines[1];
                    if (lines[2]) pub.year = lines[2];
                }
            } catch (e) {}
        }
        delete pub.hasMeta;
        pub.pdfs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }));

    publications.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
    return { version: 1, generatedAt: new Date().toISOString(), publications };
}

export async function onRequest(context) {
    const { request, env, params } = context;

    if (!isAuthorizedRequest(request)) {
        return notFoundResponse();
    }

    const bucket = env.MANGA_BUCKET;
    if (!bucket) {
        return new Response(JSON.stringify({
            error: 'R2 binding MANGA_BUCKET is not configured in Cloudflare Pages.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS }
        });
    }

    const pathSegments = Array.isArray(params.path) ? params.path : (params.path ? [params.path] : []);
    if (pathSegments.length === 0) {
        return notFoundResponse();
    }

    const action = pathSegments[0];

    // 1. GET /api/manga/catalog
    if (action === 'catalog') {
        const url = new URL(request.url);
        const forceRefresh = url.searchParams.get('refresh') === '1';

        if (!forceRefresh) {
            const cachedCatalog = await bucket.get('catalog.json');
            if (cachedCatalog) {
                return new Response(cachedCatalog.body, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Cache-Control': 'no-cache',
                        ...SECURITY_HEADERS
                    }
                });
            }
        }

        const catalog = await buildDynamicCatalog(bucket);
        return new Response(JSON.stringify(catalog), {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-cache',
                ...SECURITY_HEADERS
            }
        });
    }

    // 2. GET / HEAD /api/manga/file/<folder>/<filename>
    if (action === 'file' && pathSegments.length >= 3) {
        const objectKey = pathSegments.slice(1).map(s => decodeURIComponent(s)).join('/');
        if (objectKey.includes('..') || objectKey.startsWith('/')) {
            return notFoundResponse();
        }

        const contentType = guessContentType(objectKey);

        // Handle HEAD request (used by PDF.js to inspect Content-Length & Accept-Ranges)
        if (request.method === 'HEAD') {
            const headObj = await bucket.head(objectKey);
            if (!headObj) return notFoundResponse();

            return new Response(null, {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': String(headObj.size),
                    'Accept-Ranges': 'bytes',
                    'ETag': headObj.httpEtag || '',
                    'Cache-Control': 'private, max-age=3600',
                    ...SECURITY_HEADERS
                }
            });
        }

        // Handle HTTP Range Request (used by PDF.js to stream 512 KB chunks)
        const rangeHeader = request.headers.get('Range');
        if (rangeHeader && rangeHeader.startsWith('bytes=')) {
            const headObj = await bucket.head(objectKey);
            if (!headObj) return notFoundResponse();

            const totalSize = headObj.size;
            const match = rangeHeader.replace(/bytes=/, '').split('-');
            const start = parseInt(match[0], 10);
            const end = match[1] ? Math.min(parseInt(match[1], 10), totalSize - 1) : totalSize - 1;

            if (isNaN(start) || isNaN(end) || start > end || start < 0 || start >= totalSize) {
                return new Response('Requested Range Not Satisfiable', {
                    status: 416,
                    headers: {
                        'Content-Range': `bytes */${totalSize}`,
                        ...SECURITY_HEADERS
                    }
                });
            }

            const length = end - start + 1;
            const partObj = await bucket.get(objectKey, {
                range: { offset: start, length }
            });
            if (!partObj) return notFoundResponse();

            return new Response(partObj.body, {
                status: 206,
                headers: {
                    'Content-Type': contentType,
                    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                    'Content-Length': String(length),
                    'Accept-Ranges': 'bytes',
                    'ETag': partObj.httpEtag || '',
                    'Cache-Control': 'private, max-age=3600',
                    ...SECURITY_HEADERS
                }
            });
        }

        // Standard full GET (e.g. thumbnail images, meta.txt)
        const fullObj = await bucket.get(objectKey);
        if (!fullObj) return notFoundResponse();

        return new Response(fullObj.body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(fullObj.size),
                'Accept-Ranges': 'bytes',
                'ETag': fullObj.httpEtag || '',
                'Cache-Control': 'private, max-age=3600',
                ...SECURITY_HEADERS
            }
        });
    }

    return notFoundResponse();
}
