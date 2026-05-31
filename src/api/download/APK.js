const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    
    // ===== BUSCAR APK =====
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
            // Buscar en APKMirror (ejemplo)
            const url = `https://www.apkmirror.com/?s=${encodeURIComponent(query)}&post_type=app_release`;
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const $ = cheerio.load(data);
            
            const resultados = [];
            
            $('.appRow').each((i, el) => {
                if (i >= 10) return;
                const titulo = $(el).find('.appRowTitle').text().trim();
                const link = 'https://www.apkmirror.com' + $(el).find('a').attr('href');
                const version = $(el).find('.infoSlide-value').first().text().trim();
                
                if (titulo) {
                    resultados.push({ titulo, version, link });
                }
            });

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

    // ===== DESCARGAR APK (obtener link directo) =====
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
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const $ = cheerio.load(data);
            
            // Buscar link de descarga
            let downloadLink = '';
            $('a').each((i, el) => {
                const href = $(el).attr('href') || '';
                const text = $(el).text().toLowerCase();
                if (href.includes('download') || text.includes('download') || text.includes('descargar')) {
                    downloadLink = href.startsWith('http') ? href : 'https://www.apkmirror.com' + href;
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
                    mensaje: "No se encontró link directo, usa esta URL para descargar manualmente"
                });
            }

        } catch (error) {
            return res.status(500).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Error al obtener descarga"
            });
        }
    });

};