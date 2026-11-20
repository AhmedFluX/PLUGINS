
const { bot, lang } = require('../lib/');

// ==========================================
// MUSIC DOWNLOADER CONFIGURATION
// ==========================================

const CONFIG = {
    API_1: 'https://saavn.sumit.co/api/search/songs',
    API_2: 'https://api.deezer.com/search',
    API_3: 'https://itunes.apple.com/search',

    API_KEY_1: '',
    API_KEY_2: '',
    API_KEY_3: '',

    MAX_FILE_SIZE: 15 * 1024 * 1024,
    TIMEOUT: 30000,
    RETRIES: 2
};

const FOOTER = '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

// ==========================================
// HELPERS
// ==========================================

function duration(sec) {
    sec = Number(sec) || 0;

    return (
        Math.floor(sec / 60) +
        ':' +
        String(Math.floor(sec % 60)).padStart(2, '0')
    );
}

function normalize(json, api, query) {

    if (json && json.audioUrl) return json;

    // DEEZER
    if (api.includes('deezer.com')) {
        const t = json?.data?.[0];

        if (!t?.preview) {
            throw new Error('No Deezer preview found');
        }

        return {
            audioUrl: t.preview,
            title: t.title || query,
            artist: t.artist?.name || 'Unknown',
            duration: duration(t.duration),
            format: 'mp3'
        };
    }

    // ITUNES
    if (api.includes('itunes.apple.com')) {
        const t = json?.results?.[0];

        if (!t?.previewUrl) {
            throw new Error('No iTunes preview found');
        }

        return {
            audioUrl: t.previewUrl,
            title: t.trackName || query,
            artist: t.artistName || 'Unknown',
            duration: duration((t.trackTimeMillis || 0) / 1000),
            format: 'm4a'
        };
    }

    // JIOSAAVN
    const results =
        json?.data?.results ||
        json?.results ||
        (Array.isArray(json?.data) ? json.data : []);

    const song = results[0];

    if (!song) {
        throw new Error('Song not found');
    }

    const downloads = Array.isArray(song.downloadUrl)
        ? song.downloadUrl
        : [];

    const best =
        downloads.find(x => x.quality === '320kbps') ||
        downloads[downloads.length - 1];

    if (!best?.url) {
        throw new Error('Audio URL not found');
    }

    const artists =
        song.artists?.primary?.map(x => x.name).join(', ') ||
        song.artist ||
        song.subtitle ||
        'Unknown';

    return {
        audioUrl: best.url,
        title: song.name || song.title || query,
        artist: artists,
        duration: duration(song.duration),
        format: 'mp3'
    };
}

// ==========================================
// SEARCH API
// ==========================================

async function searchMusic(api, key, query) {

    const controller = new AbortController();

    const timer = setTimeout(
        () => controller.abort(),
        CONFIG.TIMEOUT
    );

    try {

        const url = new URL(api);

        if (api.includes('itunes.apple.com')) {
            url.searchParams.set('term', query);
            url.searchParams.set('media', 'music');
            url.searchParams.set('limit', '5');

        } else if (api.includes('deezer.com')) {
            url.searchParams.set('q', query);

        } else {
            url.searchParams.set('query', query);
            url.searchParams.set('q', query);
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
                ...(key ? {
                    Authorization: `Bearer ${key}`
                } : {})
            },
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`API Error ${response.status}`);
        }

        const json = await response.json();

        return normalize(json, api, query);

    } finally {
        clearTimeout(timer);
    }
}

// ==========================================
// AUDIO DOWNLOADER
// ==========================================

async function downloadAudio(url) {

    const parsed = new URL(url);

    if (parsed.protocol !== 'https:') {
        throw new Error('Invalid audio URL');
    }

    const controller = new AbortController();

    const timer = setTimeout(
        () => controller.abort(),
        CONFIG.TIMEOUT
    );

    try {

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': '*/*'
            },
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error('Audio download failed');
        }

        const size = Number(
            response.headers.get('content-length') || 0
        );

        if (size > CONFIG.MAX_FILE_SIZE) {
            throw new Error('Audio file too large');
        }

        const buffer = Buffer.from(
            await response.arrayBuffer()
        );

        if (
            !buffer.length ||
            buffer.length > CONFIG.MAX_FILE_SIZE
        ) {
            throw new Error('Invalid audio file');
        }

        return buffer;

    } finally {
        clearTimeout(timer);
    }
}

// ==========================================
// MAIN MUSIC PLUGIN
// ==========================================

bot(
    {
        pattern: 'musix ?(.*)',
        desc: 'All-in-One Music Downloader',
        type: 'downloader',
        onlyGroup: false
    },

    async (message, match, ctx) => {

        try {

            const query = (
                typeof match === 'string'
                    ? match
                    : Array.isArray(match)
                        ? match[1] || ''
                        : ''
            ).trim();

            if (!query) {
                return await message.send(
                    '🎵 *MUSIC DOWNLOADER*\n\n' +
                    'Usage: .musix Song Name\n\n' +
                    'Examples:\n' +
                    '.musix Tum Hi Ho\n' +
                    '.musix Kesariya\n' +
                    '.musix maharaja song Govinda\n\n' +
                    FOOTER
                );
            }

            await message.send(
                '🔎 *SEARCHING MUSIC...*\n\n' +
                `🎧 Song: ${query}\n` +
                '⏳ Please wait...\n\n' +
                FOOTER
            );

            // API PROVIDERS
            const providers = [
                [CONFIG.API_1, CONFIG.API_KEY_1],
                [CONFIG.API_2, CONFIG.API_KEY_2],
                [CONFIG.API_3, CONFIG.API_KEY_3]
            ].filter(x => x[0]);

            let music = null;
            let lastError = null;

            // AUTOMATIC FALLBACK + RETRY

            for (const [api, key] of providers) {

                for (
                    let attempt = 0;
                    attempt <= CONFIG.RETRIES;
                    attempt++
                ) {

                    try {

                        const result = await searchMusic(
                            api,
                            key,
                            query
                        );

                        if (result?.audioUrl) {
                            music = result;
                            break;
                        }

                    } catch (error) {
                        lastError = error;
                    }
                }

                if (music) break;
            }

            if (!music) {
                console.error(lastError);

                return await message.send(
                    '❌ *MUSIC NOT FOUND*\n\n' +
                    'All music providers failed.\n' +
                    'Please try another song.\n\n' +
                    FOOTER
                );
            }

            // DOWNLOAD AUDIO

            const audio = await downloadAudio(
                music.audioUrl
            );

            const isM4a =
                music.format === 'm4a' ||
                /\.m4a(?:\?|$)/i.test(music.audioUrl);

            const cleanName = (
                music.title || query
            ).replace(/[^\w\s-]/g, '').trim() || 'Music';

            const filename =
                cleanName + (isM4a ? '.m4a' : '.mp3');

            // SEND AUDIO THROUGH AHMED-MD

            await message.send(
                audio,
                {
                    mimetype: isM4a
                        ? 'audio/mp4'
                        : 'audio/mpeg',

                    fileName: filename,
                    ptt: false
                },
                'audio'
            );

            // SUCCESS MESSAGE

            await message.send(
                '✅ *MUSIC SENT SUCCESSFULLY*\n\n' +
                `🎵 Title: ${music.title || query}\n` +
                `👤 Artist: ${music.artist || 'Unknown'}\n` +
                `⏱ Duration: ${music.duration || 'Unknown'}\n\n' +
                '🎧 Enjoy Your Music!\n\n' +
                FOOTER
            );

        } catch (error) {

            console.error(
                '[AHMED-MD MUSIC DOWNLOADER ERROR]',
                error
            );

            await message.send(
                '❌ *DOWNLOAD FAILED*\n\n' +
                'Something went wrong.\n' +
                'Please try again later.\n\n' +
                FOOTER
            );
        }
    }
);
