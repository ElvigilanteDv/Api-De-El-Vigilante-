const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

    // ===== BUSCAR Y DESCARGAR APK =====
    app.get('/search/apk', async (req, res) => {
        const query = req.query.q;
        const download = req.query.download || 'false';

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q'",
                usage: "/search/apk?q=whatsapp (buscar) | /search/apk?q=whatsapp&download=true (descargar)"
            });
        }

        try {
            // Buscar en F-Droid
            const { data } = await axios.get(
                `https://search.f-droid.org/?q=${encodeURIComponent(query)}&lang=es`,
                { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
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
                        link: link.startsWith('http') ? link : 'https://f-droid.org' + link
                    });
                }
            });

            if (resultados.length === 0) {
                return res.json({
                    status: false,
                    creator: "EL VIGILANTE",
                    mensaje: "No se encontraron resultados en F-Droid"
                });
            }

            // Si pide descarga, obtener el APK del primer resultado
            if (download === 'true' && resultados.length > 0) {
                const apkUrl = resultados[0].link;
                const { data: pageData } = await axios.get(apkUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' },
                    timeout: 8000
                });
                const $$ = cheerio.load(pageData);
                let downloadLink = '';

                $$('a').each((i, el) => {
                    const href = $$(el).attr('href') || '';
                    if (href.endsWith('.apk')) {
                        downloadLink = href.startsWith('http') ? href : 'https://f-droid.org' + href;
                    }
                });

                if (downloadLink) {
                    // Redirigir a la descarga
                    return res.redirect(downloadLink);
                } else {
                    return res.json({
                        status: false,
                        creator: "EL VIGILANTE",
                        mensaje: "No se pudo obtener el link de descarga directa"
                    });
                }
            }

            // Solo búsqueda
            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                proveedor: "F-Droid",
                query: query,
                total: resultados.length,
                resultados: resultados.map(r => ({
                    titulo: r.titulo,
                    resumen: r.resumen,
                    descargar: `/search/apk?q=${encodeURIComponent(query)}&download=true`
                }))
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