const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function tiktokSearch(query, limit = 10) {
    try {
        const url = `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9',
                'Cache-Control': 'no-cache'
            }
        });

        const html = response.data;
        
        const matches = html.match(/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
        if (!matches || !matches[1]) {
            throw new Error('No se pudo extraer datos de TikTok');
        }
        
        const jsonData = JSON.parse(matches[1]);
        const searchResult = jsonData?.__DEFAULT_SCOPE__?.['webapp.search-v3']?.data;
        
        if (!searchResult || !searchResult.item_list) {
            throw new Error('No se encontraron resultados');
        }
        
        const items = searchResult.item_list.slice(0, limit);
        
        return items.map(item => {
            const video = item.video;
            const author = item.author;
            const stats = item.stats;
            
            return {
                id: item.id,
                title: item.desc || 'Sin título',
                duration: video.duration,
                cover: video.cover,
                play: video.play_addr?.url_list?.[0] || null,
                download_url: video.download_addr?.url_list?.[0] || null,
                author: {
                    name: author.unique_id,
                    nickname: author.nickname,
                    avatar: author.avatar_thumb,
                    followers: author.follower_count,
                    verified: author.verified
                },
                stats: {
                    plays: stats.play_count || 0,
                    likes: stats.digg_count || 0,
                    comments: stats.comment_count || 0,
                    shares: stats.share_count || 0
                },
                url: `https://www.tiktok.com/@${author.unique_id}/video/${item.id}`
            };
        });
        
    } catch (error) {
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