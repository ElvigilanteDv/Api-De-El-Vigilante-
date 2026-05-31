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

        // ===== PROVEEDOR 1: Androeed =====
        try {
            const { data } = await axios.get(
                `https://androeed.com/?s=${encodeURIComponent(query)}`,
                { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }, timeout: 8000 }
            );
            const $ = cheerio.load(data);
            $('article, .post, .item').each((i, el) => {
                if (resultados.length >= 10) return;
                const titulo = $(el).find('h2, .title, .entry-title').first().text().trim();
                const link = $(el).find('a').attr('href') || '';
                const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
                if (titulo && link) {
                    resultados.push({ 
                        titulo, 
                        link: link.startsWith('http') ? link : link,
                        imagen: img.startsWith('http') ? img : '',
                        proveedor: 'Androeed' 
                    });
                }
            });
        } catch (e) {}

        // ===== PROVEEDOR 2: Modyolo =====
        try {
            const { data } = await axios.get(
                `https://modyolo.com/?s=${encodeURIComponent(query)}`,
                { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }, timeout: 8000 }
            );
            const $ = cheerio.load(data);
            $('article, .post, .app-item, .item').each((i, el) => {
                if (resultados.length >= 10) return;
                const titulo = $(el).find('h2, .title, .entry-title').first().text().trim();
                const link = $(el).find('a').attr('href') || '';
                const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
                if (titulo && link) {
                    resultados.push({ 
                        titulo, 
                        link: link.startsWith('http') ? link : link,
                        imagen: img.startsWith('http') ? img : '',
                        proveedor: 'Modyolo' 
                    });
                }
            });
        } catch (e) {}

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
    });

};