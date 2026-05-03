const axios = require('axios');
const cheerio = require('cheerio');

const KLIPY_URL = 'https://api.klipy.com/api/v1/gifs/search';
const GIPHY_DEMO_URL = 'https://api.giphy.com/v1/gifs/search';
const TENOR_URL = 'https://tenor.googleapis.com/v2/search';

async function searchGiphyDemo(query) {
    const response = await axios.get(GIPHY_DEMO_URL, {
        params: { q: query, api_key: 'demo', limit: 1 },
        timeout: 8000
    });
    const gif = response.data.data?.[0];
    if (!gif) throw new Error('No encontrado');
    return { url: gif.images?.original?.url, source: 'GIPHY Demo' };
}

async function searchKlipy(query) {
    const response = await axios.get(KLIPY_URL, {
        params: { q: query, limit: 1 },
        timeout: 8000
    });
    const gif = response.data.results?.[0]?.media?.[0]?.gif;
    if (!gif) throw new Error('No encontrado');
    return { url: gif.url, source: 'KLIPY' };
}

async function searchTenor(query) {
    const response = await axios.get(TENOR_URL, {
        params: { q: query, key: 'AIzaSyC7vNkX6dP0qHqKqVqVqVqVqVqVqVqVqV', limit: 1 },
        timeout: 8000
    });
    const gif = response.data.results?.[0]?.media_formats?.gif?.url;
    if (!gif) throw new Error('No encontrado');
    return { url: gif, source: 'Tenor' };
}

async function scrapeGiphy(query) {
    const url = `https://giphy.com/search/${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
    });
    const $ = cheerio.load(response.data);
    let gifUrl = null;
    $('img[data-gif]').each((i, el) => {
        if (!gifUrl) gifUrl = $(el).attr('data-gif');
    });
    if (!gifUrl) {
        const match = response.data.match(/https:\/\/media[^"]+\.gif/);
        if (match) gifUrl = match[0];
    }
    if (!gifUrl) throw new Error('No encontrado');
    return { url: gifUrl, source: 'GIPHY Scraping' };
}

async function searchGif(query) {
    const sources = [searchKlipy, searchTenor, searchGiphyDemo, scrapeGiphy];
    for (const source of sources) {
        try {
            const result = await source(query);
            console.log(`✅ GIF encontrado en ${result.source}`);
            return result;
        } catch (err) {
            console.log(`❌ Falló ${err.message}`);
        }
    }
    throw new Error('Todas las fuentes fallaron');
}

module.exports = function(app) {
    app.get('/random/gif', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 1;
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/gif?q=punch&limit=1"
            });
        }
        try {
            const results = [];
            for (let i = 0; i < Math.min(limit, 5); i++) {
                const result = await searchGif(query);
                results.push(result);
            }
            if (req.query.download === 'true' && results.length > 0) {
                return res.redirect(results[0].url);
            }
            return res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total: results.length,
                result: results
            });
        } catch (error) {
            console.error('[GIF Error]', error.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};