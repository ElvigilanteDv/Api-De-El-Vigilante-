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

        // ===== PROVEEDOR 1: Moddroid =====
        try {
            const { data } = await axios.get(
                `https://moddroid.com/?s=${encodeURIComponent(query)}`,
                { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }, timeout: 8000 }
            );
            const $ = cheerio.load(data);
            $('article, .post, .app-item').each((i, el) => {
                if (i >= 5) return;
                const titulo = $(el).find('h2, h3, .title').first().text().trim();
                const link = $(el).find('a').attr('href') || '';
                const img = $(el).find('img').attr('src') || '';
                if (titulo) resultados.push({ titulo, link, imagen: img, proveedor: 'Moddroid' });
            });
        } catch (e) {}

        // ===== PROVEEDOR 2: APKModget =====
        try {
            const { data } = await axios.get(
                `https://apkmodget.com/?s=${encodeURIComponent(query)}`,
                { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }, timeout: 8000 }
            );
            const $ = cheerio.load(data);
            $('article, .post').each((i, el) => {
                if (i >= 5) return;
                const titulo = $(el).find('h2, .entry-title').first().text().trim();
                const link = $(el).find('a').attr('href') || '';
                const img = $(el).find('img').attr('src') || '';
                if (titulo) resultados.push({ titulo, link, imagen: img, proveedor: 'APKModget' });
            });
        } catch (e) {}

        // ===== PROVEEDOR 3: RexDL =====
        try {
            const { data } = await axios.get(
                `https://rexdl.com/?s=${encodeURIComponent(query)}`,
                { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }, timeout: 8000 }
            );
            const $ = cheerio.load(data);
            $('article, .post').each((i, el) => {
                if (i >= 5) return;
                const titulo = $(el).find('h2, .entry-title').first().text().trim();
                const link = $(el).find('a').attr('href') || '';
                if (titulo) resultados.push({ titulo, link, proveedor: 'RexDL' });
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