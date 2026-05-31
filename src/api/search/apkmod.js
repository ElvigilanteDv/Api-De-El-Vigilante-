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

        const resultados = [];

        // ===== APKCombo =====
        try {
            const { data } = await axios.get(
                `https://apkcombo.com/es/search/${encodeURIComponent(query)}`,
                { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 10000 }
            );
            const $ = cheerio.load(data);
            
            $('.search-item, .app-item, .content-app, a[href*="/app/"]').each((i, el) => {
                if (resultados.length >= 10) return;
                
                const titulo = $(el).find('.title, h2, .app-name, .name').first().text().trim();
                const link = $(el).is('a') ? $(el).attr('href') : $(el).find('a').attr('href') || '';
                const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
                const version = $(el).find('.version, .ver').first().text().trim();
                
                if (titulo && link) {
                    resultados.push({
                        titulo,
                        version: version || 'Mod',
                        link: link.startsWith('http') ? link : 'https://apkcombo.com' + link,
                        imagen: img.startsWith('http') ? img : (img.startsWith('/') ? 'https://apkcombo.com' + img : ''),
                        proveedor: 'APKCombo'
                    });
                }
            });
        } catch (e) {
            console.log('APKCombo error:', e.message);
        }

        // ===== APKPure (respaldo) =====
        if (resultados.length === 0) {
            try {
                const { data } = await axios.get(
                    `https://apkpure.com/es/search?q=${encodeURIComponent(query)}`,
                    { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }, timeout: 10000 }
                );
                const $ = cheerio.load(data);
                
                $('.search-results li, .category-template .apk, .search-dl').each((i, el) => {
                    if (resultados.length >= 10) return;
                    const titulo = $(el).find('.p_title, .title, h2').first().text().trim();
                    const link = $(el).find('a').attr('href') || '';
                    const img = $(el).find('img').attr('src') || '';
                    
                    if (titulo && link) {
                        resultados.push({
                            titulo,
                            link: link.startsWith('http') ? link : 'https://apkpure.com' + link,
                            imagen: img.startsWith('http') ? img : '',
                            proveedor: 'APKPure'
                        });
                    }
                });
            } catch (e) {
                console.log('APKPure error:', e.message);
            }
        }

        if (resultados.length === 0) {
            return res.json({
                status: false,
                creator: "EL VIGILANTE",
                mensaje: "No se encontraron resultados. Prueba con otro nombre."
            });
        }

        return res.json({
            status: true,
            creator: "EL VIGILANTE",
            query: query,
            total: resultados.length,
            resultados
        });
    });

};