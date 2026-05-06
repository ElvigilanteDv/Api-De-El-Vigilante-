// ==================== ENDPOINT: /download/ytvideo ====================
const axios = require('axios');

async function downloadYouTubeVideo(url, quality = "360") {
    try {
        const downloadResp = await axios.get(
            "https://p.savenow.to/ajax/download.php",
            {
                params: {
                    copyright: 0,
                    format: quality,
                    url,
                    api: "dfcb6d76f2f6a9894gjkege8a4ab232222"
                },
                headers: {
                    Accept: "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                }
            }
        );

        const data = downloadResp.data;
        if (!data.success || !data.id) {
            throw new Error('No se pudo iniciar la descarga');
        }

        const downloadId = data.id;
        let downloadUrl = null;

        while (!downloadUrl) {
            const progressResp = await axios.get(
                "https://p.savenow.to/api/progress",
                {
                    params: { id: downloadId },
                    headers: { Accept: "application/json" }
                }
            );

            const progressData = progressResp.data;
            if (progressData.success === 1 && progressData.download_url) {
                downloadUrl = progressData.download_url;
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return {
            title: data.info?.title || 'YouTube Video',
            thumbnail: data.info?.image || '',
            download_url: downloadUrl
        };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function(app) {
    app.get('/download/ytvideo', async (req, res) => {
        const url = req.query.url;
        const quality = req.query.quality || '360';

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'",
                usage: "/download/ytvideo?url=YOUTUBE_URL&quality=360"
            });
        }

        // Validar calidad
        const validQualities = ['360', '720', '1080'];
        if (quality && !validQualities.includes(quality)) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: `Calidad inválida. Usa: ${validQualities.join(', ')}`,
                usage: "/download/ytvideo?url=YOUTUBE_URL&quality=360"
            });
        }

        try {
            const result = await downloadYouTubeVideo(url, quality);

            if (req.query.download === 'true') {
                return res.redirect(result.download_url);
            }

            return res.json({
                status: true,
                creator: "DVLYONN",
                result: {
                    title: result.title,
                    thumbnail: result.thumbnail,
                    quality: quality + 'p',
                    format: "MP4",
                    download_url: result.download_url
                }
            });
        } catch (error) {
            console.error('[YouTube Video Error]', error.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};