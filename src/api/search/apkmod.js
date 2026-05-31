const axios = require('axios');

module.exports = function(app) {

    app.get('/search/apkmod', async (req, res) => {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q'",
                usage: "/search/apkmod?q=free fire"
            });
        }

        try {
            // Buscar en Happymod
            const { data } = await axios.get(
                `https://happymod.com/search.html?q=${encodeURIComponent(query)}`,
                { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }, timeout: 10000 }
            );

            // Extraer datos con regex (más simple que cheerio)
            const resultados = [];
            const regex = /<a href="(https:\/\/happymod\.com\/[^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<h2[^>]*>([^<]+)<\/h2>/gi;
            let match;

            while ((match = regex.exec(data)) !== null && resultados.length < 10) {
                resultados.push({
                    titulo: match[3].trim(),
                    link: match[1],
                    imagen: match[2],
                    proveedor: 'Happymod'
                });
            }

            // Si no encuentra con regex, intentar con cheerio
            if (resultados.length === 0) {
                const cheerio = require('cheerio');
                const $ = cheerio.load(data);
                $('.pdt-app-box, .app-box, .search-result, article').each((i, el) => {
                    if (i >= 10) return;
                    const titulo = $(el).find('h2, h3, .title, .app-title').first().text().trim();
                    const link = $(el).find('a').attr('href') || '';
                    const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
                    if (titulo) {
                        resultados.push({
                            titulo,
                            link: link.startsWith('http') ? link : 'https://happymod.com' + link,
                            imagen: img.startsWith('http') ? img : '',
                            proveedor: 'Happymod'
                        });
                    }
                });
            }

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
                query: query,
                total: resultados.length,
                resultados
            });

        } catch (error) {
            return res.status(500).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Error en la búsqueda: " + error.message
            });
        }
    });

};