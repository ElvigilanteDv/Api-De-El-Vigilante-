// youtube-piped-scraper.js
const axios = require('axios');

const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://piped.syncpundit.io',
    'https://pipedapi.adminforge.de',
    'https://piped.moomoo.me',
    'https://piped.privacydev.net'
];

async function searchYouTubePiped(query, limit = 20) {
    for (const instance of PIPED_INSTANCES) {
        try {
            const url = `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`;
            const response = await axios.get(url, { timeout: 10000 });
            const items = response.data.items || [];
            
            if (items.length) {
                return items.slice(0, limit).map(video => ({
                    title: video.title,
                    channel: video.uploaderName,
                    channelId: video.uploaderUrl?.split('/').pop(),
                    duration: formatDuration(video.duration),
                    views: video.views?.toLocaleString() || "N/A",
                    thumbnail: video.thumbnail,
                    url: `https://www.youtube.com/watch?v=${video.url}`,
                    publishedAt: video.uploadedDate || "N/A"
                }));
            }
        } catch (e) {
            console.log(`[Piped] ${instance} falló: ${e.message}`);
        }
    }
    return [];
}

function formatDuration(seconds) {
    if (!seconds) return "?";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 20;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'"
            });
        }

        try {
            const results = await searchYouTubePiped(query, Math.min(limit, 50));
            res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};