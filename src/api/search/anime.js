
const axios = require('axios');

module.exports = function(app) {

    app.get('/search/anime', async (req, res) => {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q'",
                usage: "/search/anime?q=naruto"
            });
        }

        try {
            const { data } = await axios.get(
                `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`,
                { timeout: 10000 }
            );

            if (!data.data || data.data.length === 0) {
                return res.json({
                    status: false,
                    creator: "EL VIGILANTE",
                    mensaje: "No se encontraron resultados"
                });
            }

            const resultados = data.data.map(anime => ({
                titulo: anime.title || 'Sin título',
                titulo_ingles: anime.title_english || '',
                titulo_japones: anime.title_japanese || '',
                tipo: anime.type || 'Desconocido',
                episodios: anime.episodes || '?',
                estado: anime.status || '?',
                puntuacion: anime.score || 'N/A',
                sinopsis: anime.synopsis || '',
                imagen: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
                trailer: anime.trailer?.url || '',
                url: anime.url || '',
                generos: (anime.genres || []).map(g => g.name)
            }));

            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                fuente: "MyAnimeList (Jikan API)",
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