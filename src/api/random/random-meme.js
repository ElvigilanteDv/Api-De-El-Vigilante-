const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

    app.get('/random/meme', async (req, res) => {
        const descargar = req.query.download || 'false';

        const fuentes = [
            // Imgflip
            async () => {
                const { data } = await axios.get('https://imgflip.com/ajax-search?q=spanish+meme&nsfw=false', {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000
                });
                if (data && data.length > 0) {
                    const meme = data[Math.floor(Math.random() * data.length)];
                    return {
                        titulo: meme.title || 'Meme',
                        imagen: 'https://imgflip.com/i/' + meme.id + '.jpg',
                        fuente: 'Imgflip'
                    };
                }
                return null;
            },

            // MemesRandom
            async () => {
                const { data } = await axios.get('https://www.memesrandom.com/random', {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000
                });
                const $ = cheerio.load(data);
                const img = $('img').first().attr('src');
                if (!img) return null;
                return {
                    titulo: 'Meme aleatorio',
                    imagen: img.startsWith('http') ? img : 'https://www.memesrandom.com' + img,
                    fuente: 'MemesRandom'
                };
            },

            // API pública
            async () => {
                const { data } = await axios.get('https://meme-api.com/gimme', { timeout: 5000 });
                if (data.url) return { titulo: data.title || 'Meme', imagen: data.url, fuente: 'Meme API' };
                return null;
            }
        ];

        const shuffled = fuentes.sort(() => Math.random() - 0.5);

        for (const fuente of shuffled) {
            try {
                const resultado = await fuente();
                if (resultado && resultado.imagen) {
                    
                    // Si pide descarga, redirigir a la imagen
                    if (descargar === 'true') {
                        return res.redirect(resultado.imagen);
                    }

                    return res.json({
                        status: true,
                        creator: "EL VIGILANTE",
                        descargar: `/random/meme?download=true`,
                        ...resultado
                    });
                }
            } catch (e) {
                continue;
            }
        }

        return res.json({
            status: false,
            creator: "EL VIGILANTE",
            mensaje: "No se pudo obtener un meme"
        });
    });

};