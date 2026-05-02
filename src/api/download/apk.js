const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function searchApk(query, limit = 5) {
    try {
        const url = `https://dlandroid.com/?s=${encodeURIComponent(query)}&post_type=wpbdp_listing`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': UA },
            timeout: 15000
        });
        const $ = cheerio.load(response.data);
        const results = [];

        $('.wpbdp-listing').each((i, elem) => {
            if (results.length >= limit) return false;
            const titleElem = $(elem).find('.listing-title');
            const name = titleElem.text().trim();
            const link = titleElem.find('a').attr('href');
            const version = $(elem).find('.wpbdp-field-version').text().trim() || 'N/A';
            const size = $(elem).find('.wpbdp-field-size').text().trim() || 'N/A';
            if (name && link) results.push({ name, link, version, size });
        });
        return results;
    } catch (error) {
        throw new Error(`Error en búsqueda: ${error.message}`);
    }
}

async function getDownloadUrl(apkUrl) {
    try {
        const response = await axios.get(apkUrl, {
            headers: { 'User-Agent': UA },
            timeout: 15000
        });
        const $ = cheerio.load(response.data);
        let downloadLink = null;
        $('.download-button a').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.startsWith('http')) {
                downloadLink = href;
                return false;
            }
        });
        if (!downloadLink) {
            $('a[href*="download"]').each((i, elem) => {
                const href = $(elem).attr('href');
                if (href && href.includes('download')) {
                    downloadLink = href;
                    return false;
                }
            });
        }
        if (!downloadLink) throw new Error('No se encontró enlace de descarga');
        return { url: downloadLink };
    } catch (error) {
        throw new Error(`Error obteniendo descarga: ${error.message}`);
    }
}

module.exports = function(app) {
    app.get('/apk/search', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 5;
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/apk/search?q=whatsapp&limit=5"
            });
        }
        try {
            const results = await searchApk(query, Math.min(limit, 10));
            res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total: results.length,
                result: results
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
    
    app.get('/apk/download', async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'"
            });
        }
        try {
            const downloadInfo = await getDownloadUrl(url);
            if (req.query.download === 'true') {
                return res.redirect(downloadInfo.url);
            }
            res.json({
                status: true,
                creator: "DVLYONN",
                result: { url: downloadInfo.url }
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};