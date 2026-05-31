const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

    app.get('/random/meme', async (req, res) => {
        
        const fuentes = [
            // Fuente 1: Imgflip
            async () => {
                const { data } = await axios.get('https://imgflip.com/ajax-search?q=spanish+meme&nsfw=false', {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000
                });
                if (data && data.length > 0) {
                    const meme = data[Math.floor(Math.random() * data.length)];
                    return {
                        titulo: meme.title || meme.name || 'Meme',
                        imagen: 'https://imgflip.com/i/' + meme.id + '.jpg',
                        fuente: 'Imgflip'
                    };
                }
                return null;
            },

            // Fuente 2: MemesRandom
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

            // Fuente 3: Pinterest (memes en español)
            async () => {
                const busquedas = ['memes español', 'meme divertido', 'meme gracioso', 'shitpost español'];
                const busqueda = busquedas[Math.floor(Math.random() * busquedas.length)];
                const { data } = await axios.get(
                    `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(busqueda)}&data=%7B%22options%22%3A%7B%22query%22%3A%22${encodeURIComponent(busqueda)}%22%2C%22scope%22%3A%22pins%22%2C%22page_size%22%3A20%7D%7D`,
                    { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, timeout: 8000 }
                );
                const resultados = data?.resource_response?.data?.results;
                if (!resultados || resultados.length === 0) return null;
                const pin = resultados[Math.floor(Math.random() * resultados.length)];
                return {
                    titulo: pin.title || pin.description || 'Meme de Pinterest',
                    imagen: pin.images?.orig?.url || pin.image_url || '',
                    fuente: 'Pinterest'
                };
            },

            // Fuente 4: API pública de memes
            async () => {
                const apis = [
                    'https://meme-api.com/gimme',
                    'https://api.memegen.link/images/doge/hello/world.png',
                    'https://api.waifu.pics/sfw/megumin'
                ];
                const url = apis[Math.floor(Math.random() * apis.length)];
                const { data } = await axios.get(url, { timeout: 5000 });
                if (data.url) return { titulo: data.title || 'Meme', imagen: data.url, fuente: 'API' };
                if (data.image) return { titulo: 'Meme', imagen: data.image, fuente: 'API' };
                return null;
            }
        ];

        // Barajar fuentes
        const shuffled = fuentes.sort(() => Math.random() - 0.5);

        for (const fuente of shuffled) {
            try {
                const resultado = await fuente();
                if (resultado && resultado.imagen) {
                    return res.json({
                        status: true,
                        creator: "EL VIGILANTE",
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
            mensaje: "No se pudo obtener un meme. Intenta de nuevo."
        });
    });

};