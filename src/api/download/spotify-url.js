const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

const UA = "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36";
const BASE = "https://spowload.cc";
const ENTRY = `${BASE}/en2`;
const OEMBED = "https://open.spotify.com/oembed";

function absUrl(u) {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return `${BASE}${u}`;
    return `${BASE}/${u}`;
}

function pickHiddenToken(html) {
    const m = html.match(/name=["']_token["'][^>]*value=["']([^"']+)["']/i) ||
        html.match(/value=["']([^"']+)["'][^>]*name=["']_token["']/i);
    return m?.[1] || null;
}

function pickMetaCsrf(html) {
    const m = html.match(/name=["']csrf-token["'][^>]*content=["']([^"']+)["']/i);
    return m?.[1] || null;
}

function pickCover(html) {
    const m1 = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (m1?.[1]) return m1[1];
    const m2 = html.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    if (m2?.[1]) return m2[1];
    const m3 = html.match(/"cover"\s*:\s*"([^"]+)"/i);
    if (m3?.[1]) return m3[1].replace(/\\\//g, "/");
    const m4 = html.match(/https:\/\/i\.scdn\.co\/image\/[A-Za-z0-9]+/i);
    return m4?.[0] || null;
}

function pickTrackId(url) {
    const m = String(url || "").match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/i);
    return m?.[1] || null;
}

async function getCookieValue(jar, url, name) {
    const cookies = await jar.getCookies(url);
    const c = cookies.find((x) => x.key === name);
    return c?.value || null;
}

function decodeMaybe(v) {
    if (v == null) return null;
    try {
        return decodeURIComponent(v);
    } catch {
        return v;
    }
}

function normalizeOembed(data, inputUrl) {
    const titleRaw = String(data?.title || "").trim();
    const thumb = data?.thumbnail_url || null;

    let trackName = titleRaw || null;
    let artist = null;

    if (titleRaw && titleRaw.includes(" - ")) {
        const parts = titleRaw.split(" - ").map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
            trackName = parts[0] || trackName;
            artist = parts.slice(1).join(" - ") || null;
        }
    }

    return {
        id: pickTrackId(inputUrl),
        url: inputUrl,
        name: trackName,
        artist,
        thumbnail: thumb,
        type: data?.type || "rich",
        provider: {
            name: data?.provider_name || "Spotify",
            url: data?.provider_url || "https://open.spotify.com"
        }
    };
}

async function fetchSpotifyOembed(url) {
    try {
        const r = await axios.get(OEMBED, {
            params: { url },
            timeout: 15000,
            headers: { "user-agent": UA, accept: "application/json,text/plain,*/*" },
            validateStatus: (s) => s >= 200 && s < 500
        });

        if (r.status >= 200 && r.status < 300 && r.data) {
            return { ok: true, raw: r.data, normalized: normalizeOembed(r.data, url) };
        }

        return {
            ok: false,
            error: "oEmbed no respondió OK",
            status: r.status,
            raw: r.data ?? null
        };
    } catch (e) {
        return {
            ok: false,
            error: "Fallo consultando oEmbed",
            detail: String(e?.message || e),
            raw: e?.response?.data ?? null
        };
    }
}

async function spowload(songUrl) {
    if (!songUrl) throw new Error("URL requerida");

    const jar = new CookieJar();

    const client = wrapper(
        axios.create({
            jar,
            withCredentials: true,
            timeout: 45000,
            headers: { "user-agent": UA },
            xsrfCookieName: "XSRF-TOKEN",
            xsrfHeaderName: "X-XSRF-TOKEN"
        })
    );

    const oembed = await fetchSpotifyOembed(songUrl);

    const entryRes = await client.get(ENTRY, {
        headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            referer: ENTRY
        }
    });

    const entryHtml = String(entryRes.data || "");
    const entryToken = pickHiddenToken(entryHtml);

    if (!entryToken) {
        throw new Error("No se pudo extraer _token desde /en2");
    }

    let analyzeRes;
    try {
        analyzeRes = await client.post(
            `${BASE}/analyze`,
            new URLSearchParams({ _token: entryToken, trackUrl: songUrl }).toString(),
            {
                maxRedirects: 0,
                validateStatus: (s) => s >= 200 && s < 400,
                headers: {
                    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "content-type": "application/x-www-form-urlencoded",
                    origin: BASE,
                    referer: ENTRY
                }
            }
        );
    } catch (e) {
        throw new Error(`Fallo en POST /analyze: ${e.message}`);
    }

    const loc = analyzeRes?.headers?.location || null;
    const trackPageUrl = absUrl(loc);

    if (!trackPageUrl) {
        throw new Error("No llegó Location (redirect) desde /analyze");
    }

    const trackRes = await client.get(trackPageUrl, {
        headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            referer: ENTRY
        }
    });

    const trackHtml = String(trackRes.data || "");
    const cover = pickCover(trackHtml);

    if (!cover) {
        throw new Error("No se pudo detectar cover en la página del track");
    }

    const csrfFromMeta = pickMetaCsrf(trackHtml);
    const csrfFromHidden = pickHiddenToken(trackHtml);
    const xsrfCookieRaw = await getCookieValue(jar, BASE, "XSRF-TOKEN");
    const xsrfCookie = decodeMaybe(xsrfCookieRaw);

    const csrf = csrfFromMeta || csrfFromHidden || xsrfCookie;

    if (!csrf) {
        throw new Error("No se pudo extraer CSRF (meta/input/cookie)");
    }

    let convertRes;
    try {
        convertRes = await client.post(
            `${BASE}/convert`,
            { urls: songUrl, cover },
            {
                headers: {
                    accept: "*/*",
                    "content-type": "application/json",
                    origin: BASE,
                    referer: trackPageUrl,
                    "x-requested-with": "XMLHttpRequest",
                    "x-csrf-token": csrf,
                    "x-xsrf-token": csrf
                },
                validateStatus: (s) => s >= 200 && s < 500
            }
        );
    } catch (e) {
        throw new Error(`Fallo en POST /convert: ${e.message}`);
    }

    if (convertRes.status === 419) {
        throw new Error("CSRF inválido o sesión expirada (419)");
    }

    const data = convertRes.data;
    const directUrl = data?.url || null;

    if (!directUrl || data?.error) {
        throw new Error("Respuesta inválida de /convert");
    }

    const trackInfo = oembed.ok ? oembed.normalized : {};

    return {
        title: trackInfo.name || null,
        artist: trackInfo.artist || null,
        thumbnail: trackInfo.thumbnail || null,
        url: directUrl
    };
}

module.exports = function(app) {
    
    app.get('/download/spotify', async (req, res) => {
        const url = String(req.query.url || "").trim();

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "El parámetro 'url' es obligatorio."
            });
        }

        if (!/open\.spotify\.com\/track\//i.test(url)) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "La URL proporcionada no parece ser una canción válida de Spotify."
            });
        }

        try {
            const data = await spowload(url);
            
            if (req.query.download === 'true' && data.url) {
                return res.redirect(data.url);
            }

            return res.status(200).json({
                status: true,
                creator: "DVLYONN",
                result: data,
                download_url: `/download/spotify?url=${encodeURIComponent(url)}&download=true`
            });
        } catch (err) {
            const message = String(err?.message || "");
            const statusCode =
                /URL requerida/i.test(message) ? 400 :
                /CSRF|419|session/i.test(message) ? 502 :
                /_token|analyze|convert/i.test(message) ? 502 :
                /timeout|ETIMEDOUT|ECONNABORTED/i.test(message) ? 504 :
                500;

            return res.status(statusCode).json({
                status: false,
                creator: "DVLYONN",
                error: message && statusCode !== 500 ? message : "No se pudo obtener la descarga de Spotify."
            });
        }
    });
};