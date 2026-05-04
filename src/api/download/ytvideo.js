const axios = require('axios');

// Lista de instancias de Invidious (para tener respaldo)
const INVICIOUS_INSTANCES = [
    'https://inv.riverside.rocks',
    'https://invidious.snopyta.org',
    'https://yewtu.be',
    'https://invidious.flokinet.to',
    'https://inv.zzls.xyz'
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function getVideoUrl(videoId, quality = 'medium') {
    for (const instance of INVICIOUS_INSTANCES) {
        try {
            // Pedir info del video a Invidious
            const url = `${instance}/api/v1/videos/${videoId}`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': UA },
                timeout: 8000
            });

            const data = response.data;
            const formatos = data.formatStreams || [];

            // Buscar formato deseado
            let formatoElegido = null;
            if (quality === 'high') {
                formatoElegido = formatos.find(f => f.qualityLabel === '720p' || f.qualityLabel === '1080p');
            } else if (quality === 'medium') {
                formatoElegido = formatos.find(f => f.qualityLabel === '480p' || f.qualityLabel === '360p');
            } else if (quality === 'low') {
                formatoElegido = formatos.find(f => f.qualityLabel === '144p');
            }
            
            if (!formatoElegido && formatos.length) formatoElegido = formatos[0];
            if (formatoElegido?.url) {
                return { url: formatoElegido.url, title: data.title };
            }
        } catch (error) {
            console.log(`Instancia ${instance} falló: ${error.message}`);
        }
    }
    throw new Error('No se pudo obtener el enlace del video');
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

module.exports = function(app) {
    app.get('/download/ytvideo', async (req, res) => {
        const url = req.query.url;
        const quality = req.query.quality || 'medium'; // low, medium, high

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'",
                usage: "/download/ytvideo?url=YOUTUBE_URL&quality=medium"
            });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "URL de YouTube no válida"
            });
        }

        try {
            const videoData = await getVideoUrl(videoId, quality);
            
            if (req.query.download === 'true') {
                return res.redirect(videoData.url);
            }
            
            return res.json({
                status: true,
                creator: "DVLYONN",
                result: {
                    title: videoData.title,
                    url: videoData.url,
                    quality: quality
                }
            });
        } catch (error) {
            console.error('[YouTube Error]', error.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};