// youtube-search.js
const yts = require('yt-search');

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
        const query = req.query.q;
        let limit = parseInt(req.query.limit) || 20;

        if (isNaN(limit)) limit = 20;
        if (limit > 50) limit = 50;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q'",
                usage: "/search/youtube?q=badbunny&limit=10"
            });
        }

        try {
            // Búsqueda directa en YouTube sin API key
            const result = await yts(query);
            
            // Filtrar solo videos y limitar resultados
            const videos = result.videos.slice(0, limit);

            const results = videos.map(video => ({
                title: video.title || "Sin título",
                channel: video.author?.name || "Desconocido",
                channelId: video.author?.channelId || "",
                subscribers: "N/A",
                publishedAt: video.uploadedAt || "N/A",
                duration: video.timestamp || "00:00",
                views: video.views ? video.views.toLocaleString() : "0",
                likes: "0",
                comments: "0",
                thumbnail: video.thumbnail || "",
                url: video.url
            }));

            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                query: query,
                total_results: results.length,
                result: results
            });

        } catch (error) {
            console.error('[Error]', error.message);
            return res.status(500).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Ocurrió un error en la búsqueda"
            });
        }
    });
};