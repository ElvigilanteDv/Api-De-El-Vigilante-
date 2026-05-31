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

            // Buscar resultados
            $('a[href*="/app/"]').each((i, el) => {
                if (resultados.length >= 10) return;
                
                const href = $(el).attr('href') || '';
                const titulo = $(el).find('.title, [title], h2, h3').first().text().trim() ||
                               $(el).attr('title') || '';
                const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';

                if (href.includes('/app/') && titulo && !resultados.find(r => r.link === href)) {
                    resultados.push({
                        titulo: titulo,
                        link: href.startsWith('http') ? href : 'https://es.aptoide.com' + href,
                        imagen: img.startsWith('http') ? img : ''
                    });
                }
            });

            if (resultados.length === 0) {
                return res.json({
                    status: false,
                    creator: "EL VIGILANTE",
                    mensaje: "No se encontraron resultados para: " + query
                });
            }

            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                fuente: "Aptoide",
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