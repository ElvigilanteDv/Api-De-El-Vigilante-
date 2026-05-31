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

// Contador de solicitudes por día (se reinicia al hacer deploy)
const requestCount = {};
const LIMITE_DIARIO = 1000;

// Reiniciar contadores cada día
setInterval(() => {
    const hoy = new Date().toISOString().split('T')[0];
    for (let key in requestCount) {
        if (requestCount[key].fecha !== hoy) {
            requestCount[key] = { count: 0, fecha: hoy };
        }
    }
}, 3600000); // Cada hora

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
                error: "API Key inválida o faltante"
            });
        }

        // Control de solicitudes
        const hoy = new Date().toISOString().split('T')[0];
        if (!requestCount[apiKey] || requestCount[apiKey].fecha !== hoy) {
            requestCount[apiKey] = { count: 0, fecha: hoy };
        }
        
        if (requestCount[apiKey].count >= LIMITE_DIARIO) {
            return res.status(429).json({
                status: false,
                creator: "EL VIGILANTE",
                error: `Límite diario alcanzado (${LIMITE_DIARIO} solicitudes/día). Vuelve mañana.`
            });
        }
        requestCount[apiKey].count++;

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
                solicitudes_hoy: requestCount[apiKey].count,
                solicitudes_restantes: LIMITE_DIARIO - requestCount[apiKey].count,
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

    // Endpoint para ver estadísticas de uso
    app.get('/api/stats', (req, res) => {
        const apiKey = req.query.api_key || req.headers['x-api-key'];
        if (!apiKey || !API_KEYS.includes(apiKey)) {
            return res.status(401).json({
                status: false,
                error: "API Key inválida"
            });
        }
        
        const hoy = new Date().toISOString().split('T')[0];
        const stats = requestCount[apiKey] || { count: 0, fecha: hoy };
        
        res.json({
            status: true,
            api_key: apiKey,
            solicitudes_hoy: stats.fecha === hoy ? stats.count : 0,
            limite_diario: LIMITE_DIARIO,
            restantes: LIMITE_DIARIO - (stats.fecha === hoy ? stats.count : 0)
        });
    });
};