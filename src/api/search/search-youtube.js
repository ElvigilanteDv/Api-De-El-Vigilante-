// youtube-search.js (NUEVA VERSIÓN SIN API KEY)
const { searchYoutubeFor } = require('surfyt-api');

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
        const query = req.query.q;
        let limit = parseInt(req.query.limit) || 20;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q'"
            });
        }

        try {
            const results = await searchYoutubeFor(query, {
                showVideos: true,
                limit: limit,
                max: 50
            });

            // Formatear resultados como lo tenías antes
            const formattedResults = results.map((item, i) => ({
                title: `Video ${i+1}`,
                url: item.url,
                type: item.type
            }));

            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                query: query,
                total_results: results.length,
                result: formattedResults
            });

        } catch (error) {
            return res.status(500).json({
                status: false,
                creator: "EL VIGILANTE",
                error: error.message
            });
        }
    });
};