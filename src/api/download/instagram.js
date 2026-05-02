const axios = require('axios');

async function instagramDownload(url) {
    const apiUrl = `https://snapsave.app/fetch?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000
    });
    const data = response.data;
    if (!data || !data.url) throw new Error('No se pudo obtener el contenido');
    return {
        type: data.url.includes('.mp4') ? 'video' : 'image',
        url: data.url,
        thumbnail: data.thumbnail || '',
        title: data.title || 'Instagram Post'
    };
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