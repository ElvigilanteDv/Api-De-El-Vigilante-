const axios = require('axios');

module.exports = function(app) {
    app.get('/search/facebook', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 10;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'"
            });
        }

        try {
            // API pública de Facebook (sin token, funciona)
            const apiUrl = `https://fb-search.vercel.app/search?q=${encodeURIComponent(query)}&limit=${limit}`;
            const response = await axios.get(apiUrl, { timeout: 15000 });
            
            const posts = response.data.posts || [];
            const results = posts.map(post => ({
                id: post.id,
                message: post.text || 'Sin texto',
                created_time: post.timestamp,
                permalink_url: post.url,
                from: { name: post.author },
                likes: post.likes || 0,
                comments: post.comments || 0,
                shares: post.shares || 0
            }));
            
            return res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
            });
        } catch (error) {
            console.error('[Facebook Search Error]', error.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: "No se pudieron obtener resultados. La API pública puede estar caída temporalmente."
            });
        }
    });
};