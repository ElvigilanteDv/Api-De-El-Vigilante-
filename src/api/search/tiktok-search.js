const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function tiktokSearch(query, limit = 10) {
    try {
        const url = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}&count=${Math.min(limit, 30)}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': UA,
                'Accept': 'application/json'
            },
            timeout: 15000
        });
        
        const data = response.data;
        
        if (!data || !data.data || !data.data.videos || data.data.videos.length === 0) {
            throw new Error('No se encontraron resultados');
        }
        
        const videos = data.data.videos;
        
        return videos.slice(0, limit).map(video => ({
            id: video.id,
            title: video.title || 'Sin título',
            duration: video.duration,
            cover: video.cover,
            play: video.play,
            download_url: video.wmplay || video.hdplay || video.play,
            author: {
                name: video.author?.unique_id || 'Desconocido',
                nickname: video.author?.nickname || 'Desconocido',
                avatar: video.author?.avatar || null,
                followers: video.author?.follower_count || 0,
                verified: video.author?.verified || false
            },
            stats: {
                plays: video.play_count || 0,
                likes: video.digg_count || 0,
                comments: video.comment_count || 0,
                shares: video.share_count || 0
            },
            url: `https://www.tiktok.com/@${video.author?.unique_id || 'user'}/video/${video.id}`
        }));
        
    } catch (error) {
        console.error('TikTok search error:', error.message);
        throw new Error(`Error en búsqueda: ${error.message}`);
    }
}

module.exports = function(app) {
    
    app.get('/search/tiktok', async (req, res) => {
        const query = String(req.query.query || "").trim();
        const limit = parseInt(req.query.limit) || 10;
        
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Se requiere el parámetro 'query'",
                usage: "/search/tiktok?query=badbunny&limit=5"
            });
        }
        
        try {
            const results = await tiktokSearch(query, Math.min(limit, 30));
            
            if (results.length === 0) {
                return res.status(404).json({
                    status: false,
                    creator: "DVLYONN",
                    error: "No se encontraron resultados"
                });
            }
            
            return res.status(200).json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
            });
            
        } catch (error) {
            return res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};