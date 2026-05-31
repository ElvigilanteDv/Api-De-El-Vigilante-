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
                usage: "/search/apkmod?q=free fire"
            });
        }

        try {
            const { data } = await axios.get(
                `https://search.f-droid.org/?q=${encodeURIComponent(query)}&lang=es`,
                { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
            );

            const $ = cheerio.load(data);
            const resultados = [];

            $('.package-header').each((i, el) => {
                if (i >= 10) return;

                const titulo = $(el).find('.package-name').text().trim();
                const resumen = $(el).find('.package-summary').text().trim();
                const link = $(el).find('a.package-header').attr('href') || '';

                if (titulo) {
                    resultados.push({
                        titulo,
                        resumen: resumen || 'Sin descripción',
                        link: link.startsWith('http') ? link : 'https://f-droid.org' + link,
                        proveedor: 'F-Droid'
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
                error: "Error en la búsqueda"
            });
        }
    });

};