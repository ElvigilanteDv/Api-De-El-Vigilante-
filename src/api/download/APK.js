const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    
    // ===== BUSCAR APK CON FALLBACK =====
    app.get('/search/apk', async (req, res) => {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'q'",
                usage: "/search/apk?q=whatsapp"
            });
        }

        // Proveedores en orden (si uno falla, pasa al siguiente)
        const proveedores = [
            { nombre: 'APKMirror', buscar: buscarAPKMirror },
            { nombre: 'APKPure', buscar: buscarAPKPure },
            { nombre: 'Uptodown', buscar: buscarUptodown },
            { nombre: 'F-Droid', buscar: buscarFDroid }
        ];

        for (const proveedor of proveedores) {
            try {
                const resultados = await proveedor.buscar(query);
                if (resultados && resultados.length > 0) {
                    return res.json({
                        status: true,
                        creator: "EL VIGILANTE",
                        query: query,
                        proveedor: proveedor.nombre,
                        total: resultados.length,
                        resultados
                    });
                }
            } catch (e) {
                // Este proveedor falló, probar el siguiente
                continue;
            }
        }

        // Ningún proveedor funcionó
        return res.json({
            status: false,
            creator: "EL VIGILANTE",
            mensaje: "No se encontraron resultados en ningún proveedor. Intenta con otro nombre."
        });
    });

    // ===== BUSCADORES POR PROVEEDOR =====
    async function buscarAPKMirror(query) {
        const { data } = await axios.get(
            `https://www.apkmirror.com/?s=${encodeURIComponent(query)}&post_type=app_release`,
            { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }, timeout: 8000 }
        );
        const $ = cheerio.load(data);
        const resultados = [];
        $('.appRow').each((i, el) => {
            if (i >= 5) return;
            const titulo = $(el).find('.appRowTitle').text().trim();
            const link = 'https://www.apkmirror.com' + ($(el).find('a').attr('href') || '');
            if (titulo) resultados.push({ titulo, link });
        });
        return resultados;
    }

    async function buscarAPKPure(query) {
        const { data } = await axios.get(
            `https://apkpure.com/es/search?q=${encodeURIComponent(query)}`,
            { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }, timeout: 8000 }
        );
        const $ = cheerio.load(data);
        const resultados = [];
        $('.search-results li, .category-template .apk, .search-dl').each((i, el) => {
            if (i >= 5) return;
            const titulo = $(el).find('.p_title, .title, h2, h3').first().text().trim();
            const link = 'https://apkpure.com' + ($(el).find('a').attr('href') || '');
            if (titulo) resultados.push({ titulo, link });
        });
        return resultados;
    }

    async function buscarUptodown(query) {
        const { data } = await axios.get(
            `https://es.uptodown.com/android/buscar/${encodeURIComponent(query)}`,
            { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 8000 }
        );
        const $ = cheerio.load(data);
        const resultados = [];
        $('.item, .app-card, article').each((i, el) => {
            if (i >= 5) return;
            const titulo = $(el).find('.name, .title, h2, h3').first().text().trim();
            const link = 'https://es.uptodown.com' + ($(el).find('a').attr('href') || '');
            if (titulo) resultados.push({ titulo, link });
        });
        return resultados;
    }

    async function buscarFDroid(query) {
        const { data } = await axios.get(
            `https://search.f-droid.org/?q=${encodeURIComponent(query)}&lang=es`,
            { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
        );
        const $ = cheerio.load(data);
        const resultados = [];
        $('.package-header, .app').each((i, el) => {
            if (i >= 5) return;
            const titulo = $(el).find('.package-name, .name, h3, h4').first().text().trim();
            const link = $(el).find('a').attr('href') || '';
            if (titulo) resultados.push({
                titulo,
                link: link.startsWith('http') ? link : 'https://f-droid.org' + link
            });
        });
        return resultados;
    }

    // ===== DESCARGAR APK =====
    app.get('/download/apk', async (req, res) => {
        const url = req.query.url;

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "EL VIGILANTE",
                error: "Falta el parámetro 'url'"
            });
        }

        try {
            let downloadLink = url;
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' },
                timeout: 8000
            });
            const $ = cheerio.load(data);

            // Buscar link de descarga
            const selectors = [
                'a[href*="download"]',
                '.download-btn',
                '.download-start-btn',
                '.button.download',
                'a.tracking-download',
                '#download-button'
            ];

            for (const sel of selectors) {
                const btn = $(sel).first().attr('href');
                if (btn) {
                    if (url.includes('apkmirror.com') && !btn.startsWith('http')) {
                        downloadLink = 'https://www.apkmirror.com' + btn;
                    } else if (url.includes('uptodown.com') && !btn.startsWith('http')) {
                        downloadLink = 'https:' + btn;
                    } else if (btn.startsWith('http')) {
                        downloadLink = btn;
                    } else {
                        downloadLink = url + btn;
                    }
                    break;
                }
            }

            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                download: downloadLink
            });

        } catch (error) {
            return res.json({
                status: true,
                creator: "EL VIGILANTE",
                download: url,
                mensaje: "Descarga manual desde esta URL"
            });
        }
    });

};