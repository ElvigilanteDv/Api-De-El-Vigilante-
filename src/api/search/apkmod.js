const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

    app.get('/search/apkmod', async (req, res) => {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q'",
                example: "/search/apkmod?q=snapchat"
            });
        }

        try {
            const { data } = await axios.get(
                `https://es.aptoide.com/search?query=${encodeURIComponent(query)}`,
                { 
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
                    }, 
                    timeout: 10000 
                }
            );

            const $ = cheerio.load(data);
            const resultados = [];

            $('[data-app-id], .app-card, .search-result, a[href*="/app/"]').each((i, el) => {
                if (resultados.length >= 10) return;

                const titulo = $(el).find('[title], .title, .app-name, h2, h3').first().text().trim() ||
                               $(el).attr('title') || '';
                const link = $(el).is('a') ? $(el).attr('href') : $(el).find('a').attr('href') || '';
                const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';

                if (titulo && link) {
                    resultados.push({
                        titulo,
                        link: link.startsWith('http') ? link : 'https://es.aptoide.com' + link,
                        imagen: img.startsWith('http') ? img : ''
                    });
                }
            });

            if (resultados.length === 0) {
                return res.json({
                    status: false,
                    creator: "EL VIGILANTE",
                    mensaje: "No se encontraron resultados"
                });
            }

            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                query: query,
                total: resultados.length,
                resultados
            });

        } catch (error) {
            return res.status(500).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Error: " + error.message
            });
        }
    });

};