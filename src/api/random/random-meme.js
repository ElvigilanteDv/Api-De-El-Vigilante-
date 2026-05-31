const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

    app.get('/random/meme', async (req, res) => {
        const descargar = req.query.download || 'false';

        const fuentes = [
            // Fuente 1: Imgflip - memes en español
            async () => {
                const busquedas = ['meme+español', 'meme+gracioso', 'meme+divertido', 'shitpost+español', 'meme+latino'];
                const q = busquedas[Math.floor(Math.random() * busquedas.length)];
                const { data } = await axios.get(
                    `https://imgflip.com/ajax-search?q=${q}&nsfw=false`,
                    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
                );
                if (data && data.length > 0) {
                    const meme = data[Math.floor(Math.random() * data.length)];
                    return {
                        titulo: meme.title || meme.name || 'Meme en español',
                        imagen: 'https://imgflip.com/i/' + meme.id + '.jpg',
                        fuente: 'Imgflip'
                    };
                }
                return null;
            },

            // Fuente 2: Cuanto Cabrón (memes españoles)
            async () => {
                const paginas = ['', '/page/2', '/page/3', '/page/4', '/page/5'];
                const pag = paginas[Math.floor(Math.random() * paginas.length)];
                const { data } = await axios.get(`https://www.cuantocabron.com${pag}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000
                });
                const $ = cheerio.load(data);
                const imagenes = [];
                $('img').each((i, el) => {
                    const src = $(el).attr('src') || '';
                    if (src.includes('cuantocabron') && (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png'))) {
                        imagenes.push(src);
                    }
                });
                if (imagenes.length === 0) return null;
                const img = imagenes[Math.floor(Math.random() * imagenes.length)];
                return {
                    titulo: 'Meme español',
                    imagen: img.startsWith('http') ? img : 'https:' + img,
                    fuente: 'Cuanto Cabrón'
                };
            },

            // Fuente 3: Memedroid (memes en español)
            async () => {
                const { data } = await axios.get('https://es.memedroid.com/memes/top/day', {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000
                });
                const $ = cheerio.load(data);
                const imagenes = [];
                $('img').each((i, el) => {
                    const src = $(el).attr('src') || $(el).attr('data-src') || '';
                    if (src && (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png') || src.endsWith('.gif'))) {
                        imagenes.push(src);
                    }
                });
                if (imagenes.length === 0) return null;
                const img = imagenes[Math.floor(Math.random() * imagenes.length)];
                return {
                    titulo: 'Meme en español',
                    imagen: img.startsWith('http') ? img : 'https:' + img,
                    fuente: 'Memedroid'
                };
            }
        ];

        const shuffled = fuentes.sort(() => Math.random() - 0.5);

        for (const fuente of shuffled) {
            try {
                const resultado = await fuente();
                if (resultado && resultado.imagen) {
                    
                    if (descargar === 'true') {
                        return res.redirect(resultado.imagen);
                    }

                    return res.json({
                        status: true,
                        creator: "EL VIGILANTE",
                        idioma: "Español",
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
            mensaje: "No se pudo obtener un meme en español"
        });
    });

};