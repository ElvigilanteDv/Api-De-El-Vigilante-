const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

    app.get('/search/sticker', async (req, res) => {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q'",
                usage: "/search/sticker?q=love"
            });
        }

        try {
            // Buscar en getstickerpack.com
            const { data } = await axios.get(
                `https://getstickerpack.com/stickers/search?q=${encodeURIComponent(query)}`,
                { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
            );
            
            const $ = cheerio.load(data);
            const resultados = [];
            
            $('.sticker-pack, .sticker-item, .pack').each((i, el) => {
                if (i >= 15) return;
                const titulo = $(el).find('.title, .name, h3').first().text().trim();
                const img = $(el).find('img').attr('src') || '';
                const link = $(el).find('a').attr('href') || '';
                
                if (img) {
                    resultados.push({
                        titulo: titulo || 'Sticker ' + (i + 1),
                        imagen: img.startsWith('http') ? img : 'https://getstickerpack.com' + img,
                        pack: link ? (link.startsWith('http') ? link : 'https://getstickerpack.com' + link) : ''
                    });
                }
            });

            // Si no encuentra, usar la API pública de WhatsApp stickers
            if (resultados.length === 0) {
                try {
                    const resp = await axios.get(
                        `https://api.waifu.pics/sfw/${encodeURIComponent(query)}`,
                        { timeout: 5000 }
                    );
                    if (resp.data && resp.data.url) {
                        resultados.push({
                            titulo: query,
                            imagen: resp.data.url,
                            pack: ''
                        });
                    }
                } catch (e) {}
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