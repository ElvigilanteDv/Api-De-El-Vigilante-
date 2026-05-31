const axios = require('axios');

module.exports = function(app) {
    
    app.get('/search/tiktok', async (req, res) => {
        const query = req.query.query;
        let limit = parseInt(req.query.limit) || 10;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'query'",
                usage: "/search/tiktok?query=badbunny&limit=5"
            });
        }

        if (limit > 30) limit = 30;

        try {
            // Usar la API de TikWM para buscar
            const { data } = await axios.get(
                `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}&count=${limit}`,
                { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
            );

            if (data.code === 0 && data.data && data.data.videos) {
                const videos = data.data.videos.map(v => ({
                    id: v.video_id || '',
                    titulo: v.title || 'Sin título',
                    autor: v.author?.nickname || 'Desconocido',
                    duracion: v.duration || '00:00',
                    vistas: v.play_count?.toLocaleString() || '0',
                    video_url: v.play || '',
                    cover: v.cover || ''
                }));

                return res.json({
                    status: true,
                    creator: "EL VIGILANTE",
                    query: query,
                    total: videos.length,
                    resultados: videos
                });
            }

            return res.json({
                status: false,
                creator: "EL VIGILANTE",
                mensaje: "No se encontraron videos"
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