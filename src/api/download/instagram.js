const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function extractVideoUrl(html) {
    const patterns = [
        /"video_url":"([^"]+)"/,
        /"video_versions":\[\{"url":"([^"]+)"/,
        /"playback_url":"([^"]+)"/,
        /"src":"([^"]+\.mp4[^"]*)"/
    ];
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1].replace(/\\/g, '');
    }
    return null;
}

function extractImageUrl(html) {
    const patterns = [
        /"display_url":"([^"]+)"/,
        /"display_src":"([^"]+)"/,
        /"url":"([^"]+\.jpg[^"]*)"/
    ];
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1].replace(/\\/g, '');
    }
    return null;
}

function extractCaption(html) {
    const patterns = [
        /"caption":"([^"]+)"/,
        /"text":"([^"]+)"/,
        /<meta property="og:title" content="([^"]+)"/
    ];
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1];
    }
    return 'Instagram Post';
}

async function instagramDownload(url) {
    if (!url.includes('instagram.com')) throw new Error('URL de Instagram no válida');
    const response = await axios.get(url, {
        headers: {
            'User-Agent': UA,
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000
    });
    const html = response.data;
    let videoUrl = extractVideoUrl(html);
    let imageUrl = extractImageUrl(html);
    let type = 'none';
    let mediaUrl = null;
    if (videoUrl) {
        type = 'video';
        mediaUrl = videoUrl;
    } else if (imageUrl) {
        type = 'image';
        mediaUrl = imageUrl;
    } else {
        throw new Error('No se pudo obtener el contenido multimedia');
    }
    const caption = extractCaption(html);
    return { type, url: mediaUrl, caption };
}

module.exports = function(app) {
    app.get('/download/instagram', async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'",
                usage: "/download/instagram?url=URL_DEL_POST"
            });
        }
        try {
            const result = await instagramDownload(url);
            if (req.query.download === 'true') {
                return res.redirect(result.url);
            }
            return res.json({
                status: true,
                creator: "DVLYONN",
                result: result
            });
        } catch (err) {
            console.error('[Instagram Error]', err.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: err.message
            });
        }
    });
};