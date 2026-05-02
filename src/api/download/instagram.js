const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function instagramDownload(url) {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': UA,
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    });
    const html = response.data;
    const $ = cheerio.load(html);
    let mediaUrl = null;
    let type = 'image';
    const videoMatch = html.match(/"video_url":"([^"]+)"/);
    if (videoMatch) {
        mediaUrl = videoMatch[1].replace(/\\/g, '');
        type = 'video';
    } else {
        const imgMatch = html.match(/"display_url":"([^"]+)"/);
        if (imgMatch) {
            mediaUrl = imgMatch[1].replace(/\\/g, '');
            type = 'image';
        }
    }
    if (!mediaUrl) throw new Error('No se pudo obtener el contenido multimedia');
    const captionMatch = html.match(/"caption":"([^"]+)"/);
    const caption = captionMatch ? captionMatch[1] : 'Instagram Post';
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