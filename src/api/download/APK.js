const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    
    // ===== BUSCAR APK EN F-DROID =====
    app.get('/search/apk', async (req, res) => {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q'",
                usage: "/search/apk?q=whatsapp"
            });
        }

        try {
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

            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                proveedor: "F-Droid",
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

    // ===== DESCARGAR APK DESDE F-DROID =====
    app.get('/download/apk', async (req, res) => {
        const url = req.query.url;

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'url'",
                usage: "/download/apk?url=URL_DEL_APK"
            });
        }

        try {
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' },
                timeout: 8000
            });
            
            const $ = cheerio.load(data);
            let downloadLink = '';
            
            // Buscar link de descarga en F-Droid
            $('a').each((i, el) => {
                const href = $(el).attr('href') || '';
                if (href.endsWith('.apk')) {
                    downloadLink = href.startsWith('http') ? href : 'https://f-droid.org' + href;
                }
            });

            if (downloadLink) {
                return res.json({
                    status: true,
                    creator: "EL VIGILANTE",
                    download: downloadLink
                });
            } else {
                return res.json({
                    status: true,
                    creator: "EL VIGILANTE",
                    download: url,
                    mensaje: "No se encontró link directo. Descarga manual desde F-Droid"
                });
            }

        } catch (error) {
            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                download: url,
                mensaje: "Usa esta URL para descargar manualmente"
            });
        }
    });

};