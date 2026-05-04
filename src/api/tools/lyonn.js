// src/api/audio.js
const axios = require('axios');

const AUDIO_URL = 'https://files.catbox.moe/i427hk.mp3';

module.exports = function(app) {
    app.get('/tools/lyonn', async (req, res) => {
        // Si el usuario pide descarga directa o es una petición normal de audio
        if (req.query.download === 'true') {
            return res.redirect(AUDIO_URL);
        }

        try {
            const response = await axios.get(AUDIO_URL, { responseType: 'stream' });
            res.setHeader('Content-Type', 'audio/mpeg');
            response.data.pipe(res);
        } catch (err) {
            // Si hay error, devolver JSON (pero esto no debería pasar si la URL es válida)
            res.status(500).json({ error: err.message });
        }
    });
};