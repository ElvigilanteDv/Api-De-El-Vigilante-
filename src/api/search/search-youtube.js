const yts = require('yt-search');

// 10 API Keys válidas para 2026
const API_KEYS = [
    'ElVigilante2026_X1',
    'ElVigilante2026_X2',
    'ElVigilante2026_X3',
    'ElVigilante2026_X4',
    'ElVigilante2026_X5',
    'ElVigilante2026_X6',
    'ElVigilante2026_X7',
    'ElVigilante2026_X8',
    'ElVigilante2026_X9',
    'ElVigilante2026_X10'
];

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
        const query = req.query.q;
        let limit = parseInt(req.query.limit) || 20;

        // Validar API Key
        const apiKey = req.query.api_key || req.headers['x-api-key'];
        if (!apiKey || !API_KEYS.includes(apiKey)) {
            return res.status(401).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "API Key inválida o faltante. Solicita una en https://apivigilante.xo.je"
            });
        }

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q'",
                usage: "/search/youtube?q=badbunny&api_key=TU_KEY"
            });
        }

        try {
            const result = await yts(query);
            const videos = result.videos.slice(0, Math.min(limit, 50));

            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                query: query,
                total_results: videos.length,
                result: videos.map(v => ({
                    title: v.title || "Sin título",
                    channel: v.author?.name || "Desconocido",
                    duration: v.timestamp || "00:00",
                    views: v.views?.toLocaleString() || "0",
                    url: v.url
                }))
            });

        } catch (error) {
            return res.status(500).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Error en la búsqueda"
            });
        }
    });
};