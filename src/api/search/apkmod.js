const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

    app.get('/search/apkmod', async (req, res) => {
        const query = req.query.q;
        const descargar = req.query.url;

        // ===== DESCARGAR APK =====
        if (descargar) {
            try {
                const { data } = await axios.get(descargar, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' },
                    timeout: 10000
                });

                const $ = cheerio.load(data);
                let downloadLink = '';

                $('a').each((i, el) => {
                    const href = $(el).attr('href') || '';
                    if (href.endsWith('.apk')) {
                        downloadLink = href.startsWith('http') ? href : 'https://f-droid.org' + href;
                    }
                });

                if (downloadLink) {
                    return res.redirect(downloadLink);
                }

                return res.json({
                    status: false,
                    creator: "EL VIGILANTE",
                    mensaje: "No se encontró link de descarga directa. Usa la URL manualmente."
                });

            } catch (error) {
                return res.status(500).json({
                    status: false,
                    creator: "EL VIGILANTE",
                    error: "Error al descargar"
                });
            }
        }

        // ===== BUSCAR APK =====
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                buscar: "/search/apkmod?q=free fire",
                descargar: "/search/apkmod?url=URL_DE_LA_APP"
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
                    const urlCompleta = link.startsWith('http') ? link : 'https://f-droid.org' + link;
                    resultados.push({
                        titulo,
                        resumen: resumen || 'Sin descripción',
                        link: urlCompleta,
                        descargar: `/search/apkmod?url=${encodeURIComponent(urlCompleta)}`,
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