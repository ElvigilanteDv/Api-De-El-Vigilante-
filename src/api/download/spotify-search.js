const axios = require("axios");

const client_id = process.env.SPOTIFY_CLIENT_ID || "";
const client_secret = process.env.SPOTIFY_CLIENT_SECRET || "";

let access_token = "";
let token_expiry = 0;

function cleanText(x) {
    return String(x || "").trim();
}

function formatDuration(ms) {
    const n = Number(ms);
    if (!Number.isFinite(n) || n < 0) return null;
    const totalSec = Math.floor(n / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

function formatReleaseDateDMY(dateStr) {
    const s = cleanText(dateStr);
    if (!s) return null;

    const m = s.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
    if (!m) return null;

    const year = m[1];
    const month = m[2] || "01";
    const day = m[3] || "01";

    return `${day}/${month}/${year}`;
}

async function getSpotifyToken(timeout = 45000) {
    if (access_token && Date.now() < token_expiry) return access_token;
    if (!client_id || !client_secret) {
        throw new Error("Spotify no está configurado. Define SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET.");
    }

    const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

    const res = await axios.post(
        "https://accounts.spotify.com/api/token",
        "grant_type=client_credentials",
        {
            timeout,
            headers: {
                Authorization: `Basic ${basic}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            validateStatus: () => true
        }
    );

    if (res.status < 200 || res.status >= 400) {
        const errMsg = res.data?.error_description || res.data?.error || `Spotify token HTTP ${res.status}`;
        throw new Error(errMsg);
    }

    access_token = res.data.access_token;
    token_expiry = Date.now() + (Number(res.data.expires_in || 0) * 1000) - 5000;

    return access_token;
}

function mapTrack(item) {
    const title = item?.name || null;
    const artist = Array.isArray(item?.artists)
        ? item.artists.map(a => a?.name).filter(Boolean).join(", ")
        : null;

    const albumName = item?.album?.name || null;
    const isAlbum = Boolean(albumName);
    const releaseDate = formatReleaseDateDMY(item?.album?.release_date);
    const duration = formatDuration(item?.duration_ms);

    return {
        title,
        artist,
        link: item?.external_urls?.spotify || null,
        image: item?.album?.images?.[0]?.url || null,
        duration,
        popularity: typeof item?.popularity === "number" ? item.popularity : null,
        explicit: typeof item?.explicit === "boolean" ? item.explicit : null,
        isAlbum,
        album: albumName,
        published: releaseDate
    };
}

function mapAlbum(item) {
    const title = item?.name || null;
    const artist = Array.isArray(item?.artists)
        ? item.artists.map(a => a?.name).filter(Boolean).join(", ")
        : null;
    const releaseDate = formatReleaseDateDMY(item?.release_date);

    return {
        title,
        artist,
        link: item?.external_urls?.spotify || null,
        image: item?.images?.[0]?.url || null,
        albumType: item?.album_type || null,
        totalTracks: typeof item?.total_tracks === "number" ? item.total_tracks : null,
        published: releaseDate
    };
}

function normalizeType(type) {
    const value = cleanText(type).toLowerCase();
    if (value === "track" || value === "tracks") return "track";
    if (value === "album" || value === "albums") return "album";
    return null;
}

async function spotifySearch(query, type = "track", limit = 10, timeout = 45000) {
    const q = cleanText(query);
    if (!q) throw new Error("query requerido");

    const lim = Number.isFinite(Number(limit)) ? Math.min(50, Math.max(1, Number(limit))) : 10;
    const resolvedType = normalizeType(type);
    if (!resolvedType) throw new Error("type invalido");

    const token = await getSpotifyToken(timeout);

    const url =
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}` +
        `&type=${encodeURIComponent(resolvedType)}&limit=${encodeURIComponent(String(lim))}`;

    const res = await axios.get(url, {
        timeout,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
        },
        validateStatus: () => true
    });

    if (res.status < 200 || res.status >= 400) {
        const msg =
            res.data?.error?.message ||
            res.data?.error_description ||
            `Spotify search HTTP ${res.status}`;
        throw new Error(msg);
    }

    const items =
        resolvedType === "album"
            ? res.data?.albums?.items
            : res.data?.tracks?.items;
    const results = Array.isArray(items)
        ? items.map(resolvedType === "album" ? mapAlbum : mapTrack)
        : [];

    return {
        query: q,
        limit: lim,
        type: resolvedType,
        results
    };
}

module.exports = function(app) {
    
    app.get('/search/spotify', async (req, res) => {
        const query = String(req.query.query || "").trim();
        const limit = req.query.limit;
        const typeRaw = String(req.query.type || "tracks").trim();
        const type = normalizeType(typeRaw);

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "El parámetro 'query' es obligatorio."
            });
        }

        if (!type) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "El parámetro 'type' debe ser 'tracks' o 'albums'."
            });
        }

        try {
            const result = await spotifySearch(query, type, limit, 45000);

            return res.status(200).json({
                status: true,
                creator: "DVLYONN",
                result
            });
        } catch (err) {
            const message = String(err?.message || "");
            const statusCode =
                /query requerido/i.test(message) ? 400 :
                /invalid client|invalid_client/i.test(message) ? 502 :
                /token/i.test(message) ? 502 :
                /timeout|ETIMEDOUT|ECONNABORTED/i.test(message) ? 504 :
                500;

            return res.status(statusCode).json({
                status: false,
                creator: "DVLYONN",
                error: message && statusCode !== 500 ? message : "No se pudo obtener datos de Spotify."
            });
        }
    });
};