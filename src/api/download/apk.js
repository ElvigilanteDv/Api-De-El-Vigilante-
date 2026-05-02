const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function getRandomUA() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const fuentes = [
    {
        nombre: 'APKMirror',
        buscar: async (query, limit) => {
            const url = `https://www.apkmirror.com/?post_type=app&s=${encodeURIComponent(query)}`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': getRandomUA() }, timeout: 15000 });
            const $ = cheerio.load(data);
            const results = [];
            $('.appRow').each((i, el) => {
                if (results.length >= limit) return false;
                const nameElem = $(el).find('.appRowTitle');
                const name = nameElem.text().trim();
                const link = 'https://www.apkmirror.com' + nameElem.attr('href');
                const version = $(el).find('.versionWrap').text().trim();
                const size = $(el).find('.table-cell.right').text().trim();
                if (name && link) results.push({ name, link, version, size, fuente: 'APKMirror' });
            });
            return results;
        }
    },
    {
        nombre: 'APKPure',
        buscar: async (query, limit) => {
            const url = `https://apkpure.net/search?q=${encodeURIComponent(query)}`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': getRandomUA() }, timeout: 15000 });
            const $ = cheerio.load(data);
            const results = [];
            $('.search-result-item').each((i, el) => {
                if (results.length >= limit) return false;
                const name = $(el).find('.title').text().trim();
                const link = $(el).find('a').attr('href');
                const version = $(el).find('.version').text().trim();
                const size = $(el).find('.size').text().trim();
                if (name && link) results.push({ name, link, version, size, fuente: 'APKPure' });
            });
            return results;
        }
    },
    {
        nombre: 'Dlandroid',
        buscar: async (query, limit) => {
            const url = `https://dlandroid.com/?s=${encodeURIComponent(query)}&post_type=wpbdp_listing`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': getRandomUA() }, timeout: 15000 });
            const $ = cheerio.load(data);
            const results = [];
            $('.wpbdp-listing').each((i, el) => {
                if (results.length >= limit) return false;
                const titleElem = $(el).find('.listing-title');
                const name = titleElem.text().trim();
                const link = titleElem.find('a').attr('href');
                const version = $(el).find('.wpbdp-field-version').text().trim();
                const size = $(el).find('.wpbdp-field-size').text().trim();
                if (name && link) results.push({ name, link, version, size, fuente: 'Dlandroid' });
            });
            return results;
        }
    },
    {
        nombre: 'APKCombo',
        buscar: async (query, limit) => {
            const url = `https://apkcombo.com/es/search?q=${encodeURIComponent(query)}`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': getRandomUA() }, timeout: 15000 });
            const $ = cheerio.load(data);
            const results = [];
            $('.search-result').each((i, el) => {
                if (results.length >= limit) return false;
                const name = $(el).find('.title').text().trim();
                const link = 'https://apkcombo.com' + $(el).find('a').attr('href');
                const version = $(el).find('.version').text().trim();
                const size = $(el).find('.size').text().trim();
                if (name && link) results.push({ name, link, version, size, fuente: 'APKCombo' });
            });
            return results;
        }
    },
    {
        nombre: 'APKDownload',
        buscar: async (query, limit) => {
            const url = `https://apkdownload.com/search?q=${encodeURIComponent(query)}`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': getRandomUA() }, timeout: 15000 });
            const $ = cheerio.load(data);
            const results = [];
            $('.app-item').each((i, el) => {
                if (results.length >= limit) return false;
                const name = $(el).find('.app-name').text().trim();
                const link = $(el).find('a').attr('href');
                const version = $(el).find('.version').text().trim();
                const size = $(el).find('.size').text().trim();
                if (name && link) results.push({ name, link, version, size, fuente: 'APKDownload' });
            });
            return results;
        }
    }
];

async function searchApk(query, limit = 5) {
    for (const fuente of fuentes) {
        try {
            const results = await fuente.buscar(query, limit);
            if (results.length > 0) {
                return results;
            }
        } catch (err) {
        }
    }
    throw new Error('No se encontraron resultados en ninguna fuente');
}

async function getDownloadUrl(apkUrl) {
    try {
        const { data } = await axios.get(apkUrl, { headers: { 'User-Agent': getRandomUA() }, timeout: 15000 });
        const $ = cheerio.load(data);
        let downloadLink = null;

        const selectores = [
            'a[download]', 'a.download-button', 'a:contains("Download")', 'a:contains("Descargar")',
            'a[href*="download"]', '.download-link a', '.download-btn', '.btn-download'
        ];
        for (const sel of selectores) {
            const el = $(sel).first();
            if (el.attr('href')) {
                downloadLink = el.attr('href');
                break;
            }
        }

        if (!downloadLink) {
            const scripts = $('script').map((i, el) => $(el).html()).get();
            for (const script of scripts) {
                const match = script.match(/https?:\/\/[^\s"']+\.apk/i);
                if (match) {
                    downloadLink = match[0];
                    break;
                }
            }
        }

        if (!downloadLink) throw new Error('No se encontró enlace de descarga');
        if (!downloadLink.startsWith('http')) {
            const base = new URL(apkUrl);
            downloadLink = base.origin + downloadLink;
        }
        return { url: downloadLink };
    } catch (err) {
        throw new Error(`Error obteniendo descarga: ${err.message}`);
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