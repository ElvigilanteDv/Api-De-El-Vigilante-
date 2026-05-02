const axios = require('axios');
const crypto = require('crypto');

const UA = 'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0';

class SpotifyDownloader {
    constructor() {
        this.ky = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
        this.m = /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
        this.is = axios.create({
            headers: {
                'content-type': 'application/json',
                'origin': 'https://yt.savetube.me',
                'user-agent': UA
            }
        });
    }

    async decrypt(enc) {
        const sr = Buffer.from(enc, 'base64');
        const ky = Buffer.from(this.ky, 'hex');
        const iv = sr.slice(0, 16);
        const dt = sr.slice(16);
        const dc = crypto.createDecipheriv('aes-128-cbc', ky, iv);
        return JSON.parse(Buffer.concat([dc.update(dt), dc.final()]).toString());
    }

    async getCdn() {
        const response = await this.is.get("https://media.savetube.vip/api/random-cdn");
        if (!response.status) return response;
        return { status: true, data: response.data.cdn };
    }

    async getTrackInfo(trackId) {
        try {
            const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: {
                    'User-Agent': UA,
                    'Authorization': 'Bearer BQCxT9M3d2FQ6yX4bK8pL2nR7vW5zJ9sM3cV8bN7mK2jH5gF6dS1aE4rT9yU3iL0oP'
                }
            });
            return {
                title: response.data.name,
                artist: response.data.artists.map(a => a.name).join(', '),
                thumbnail: response.data.album.images[0]?.url || null,
                duration: response.data.duration_ms
            };
        } catch (error) {
            return {
                title: 'Unknown Title',
                artist: 'Unknown Artist',
                thumbnail: null,
                duration: 0
            };
        }
    }

    async download(url) {
        const match = url.match(this.m);
        if (!match) throw new Error('URL de Spotify no válida');
        
        const trackId = match[1];
        const trackInfo = await this.getTrackInfo(trackId);
        
        // Buscar en YouTube el título y artista
        const searchQuery = encodeURIComponent(`${trackInfo.title} ${trackInfo.artist} audio`);
        const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
        
        const searchRes = await axios.get(youtubeSearchUrl, {
            headers: { 'User-Agent': UA }
        });
        
        const videoIdMatch = searchRes.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (!videoIdMatch) throw new Error('No se encontró el audio en YouTube');
        
        const videoId = videoIdMatch[1];
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        const u = await this.getCdn();
        if (!u.status) throw new Error('Error obteniendo CDN');
        
        const res = await this.is.post(`https://${u.data}/v2/info`, { url: youtubeUrl });
        const dec = await this.decrypt(res.data.data);
        
        const dl = await this.is.post(`https://${u.data}/download`, {
            id: videoId,
            downloadType: 'audio',
            quality: '128',
            key: dec.key
        });
        
        return {
            title: trackInfo.title,
            artist: trackInfo.artist,
            thumbnail: trackInfo.thumbnail || dec.thumbnail,
            duration: trackInfo.duration || dec.duration,
            download_url: dl.data.data.downloadUrl
        };
    }
}

module.exports = function(app) {
    app.get('/download/spotify', async (req, res) => {
        const url = String(req.query.url || "").trim();
        
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Se requiere el parámetro 'url'",
                usage: "/download/spotify?url=https://open.spotify.com/track/xxxxx"
            });
        }
        
        if (!url.includes('open.spotify.com/track/')) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "URL de Spotify no válida. Usa una URL de canción (track)"
            });
        }
        
        try {
            const downloader = new SpotifyDownloader();
            const result = await downloader.download(url);
            
            if (req.query.download === 'true' && result.download_url) {
                return res.redirect(result.download_url);
            }
            
            return res.status(200).json({
                status: true,
                creator: "DVLYONN",
                result: {
                    title: result.title,
                    artist: result.artist,
                    thumbnail: result.thumbnail,
                    duration: result.duration,
                    download_url: result.download_url
                }
            });
            
        } catch (error) {
            console.error('Spotify error:', error.message);
            return res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};