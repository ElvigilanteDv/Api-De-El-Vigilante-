const axios = require('axios');

module.exports = function(app) {
    app.get('/search/tiktok', async (req, res) => {
        const query = req.query.query;
        
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'query'"
            });
        }
        
        const limit = parseInt(req.query.limit) || 10;
        
        try {
            // Usar API pública de TikTok (sin key)
            const response = await axios.get(`https://api.tiktokv.com/aweme/v1/discover/search/?keyword=${encodeURIComponent(query)}&count=${limit}`, {
                headers: {
                    'User-Agent': 'com.zhiliaoapp.musically/2020 (Linux; U; Android 10; en_US; ONEPLUS A6013; Build/QKQ1.190716.003; Cronet/58.0.2991.0)'
                },
                timeout: 8000
            });
            
            if (response.data?.aweme_list?.length > 0) {
                const results = response.data.aweme_list.map(video => ({
                    id: video.aweme_id,
                    title: video.desc,
                    duration: video.duration,
                    cover_url: video.video?.cover?.url_list?.[0] || '',
                    play_count: video.statistics?.play_count || 0,
                    digg_count: video.statistics?.digg_count || 0,
                    author: {
                        name: video.author?.unique_id,
                        nickname: video.author?.nickname
                    },
                    url: `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.aweme_id}`
                }));
                
                return res.json({
                    status: true,
                    creator: "EL VIGILANTE",
                    query: query,
                    total_results: results.length,
                    result: results
                });
            } else {
                throw new Error('No hay resultados');
            }
            
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Error en la búsqueda"
            });
        }
    });
};