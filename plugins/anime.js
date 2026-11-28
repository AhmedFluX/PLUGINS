
const { cmd } = require('../command');

const API = 'https://api.jikan.moe/v4';
const CACHE = new Map();
const CACHE_TIME = 60 * 1000;
let lastRequest = 0;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function request(endpoint) {
    const url = API + endpoint;

    if (CACHE.has(url)) {
        const cached = CACHE.get(url);
        if (Date.now() - cached.time < CACHE_TIME) {
            return cached.data;
        }
    }

    const delay = Math.max(0, 1100 - (Date.now() - lastRequest));
    if (delay) await wait(delay);

    lastRequest = Date.now();

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'AHMED-MD/1.0'
        },
        signal: AbortSignal.timeout(15000)
    });

    if (response.status === 429) {
        throw new Error('Jikan API rate limit reached. Try again shortly.');
    }

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const json = await response.json();

    CACHE.set(url, {
        data: json,
        time: Date.now()
    });

    return json;
}

function clean(text) {
    return String(text || 'Not available')
        .replace(/<[^>]*>/g, '')
        .replace(/\r/g, '')
        .trim();
}

function limit(text, max = 700) {
    text = clean(text);
    return text.length > max
        ? text.slice(0, max) + '...'
        : text;
}

function image(item) {
    return item?.images?.jpg?.large_image_url ||
        item?.images?.jpg?.image_url ||
        item?.images?.webp?.image_url ||
        '';
}

function title(item) {
    return item?.title || item?.name || 'Unknown';
}

function formatAnime(a) {
    return (
        `╭━━〔 *AHMED-MD ANIME* 〕━━╮\n` +
        `┃\n` +
        `┃ 🎬 *${title(a)}*\n` +
        `┃\n` +
        `┃ 🆔 ID: ${a.mal_id || 'N/A'}\n` +
        `┃ ⭐ Score: ${a.score || 'N/A'}\n` +
        `┃ 🏆 Rank: ${a.rank || 'N/A'}\n` +
        `┃ 📺 Episodes: ${a.episodes ?? 'N/A'}\n` +
        `┃ 🎭 Type: ${a.type || 'N/A'}\n` +
        `┃ 📡 Status: ${a.status || 'N/A'}\n` +
        `┃ 📅 Year: ${a.year || 'N/A'}\n` +
        `┃ 🏢 Studio: ${(a.studios || []).map(x => x.name).join(', ') || 'N/A'}\n` +
        `┃\n` +
        `┃ 📝 *Synopsis:*\n` +
        `┃ ${limit(a.synopsis, 650)}\n` +
        `┃\n` +
        `┃ 🔗 ${a.url || 'N/A'}\n` +
        `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
        `© POWERED BY AHMED-MD`
    );
}

function formatList(items, type = 'anime') {
    if (!items?.length) return '❌ No results found.';

    return items.slice(0, 10).map((item, i) => {
        return (
            `\n${i + 1}. *${title(item)}*\n` +
            `   🆔 ID: ${item.mal_id}\n` +
            `   ⭐ Score: ${item.score || 'N/A'}\n` +
            `   🔗 ${item.url || 'N/A'}`
        );
    }).join('\n');
}

function register(pattern, desc, handler) {
    cmd({
        pattern,
        desc,
        category: 'anime'
    }, async (conn, mek, m, { from, q, reply }) => {
        try {
            await handler({
                conn, mek, m, from, q, reply
            });
        } catch (error) {
            console.error('[JIKAN]', error);
            const message = error.name === 'TimeoutError'
                ? 'API request timed out. Try again.'
                : error.message || 'Something went wrong.';

            await reply(`❌ *AHMED-MD ERROR*\n\n${message}`);
        }
    });
}

async function sendList(reply, endpoint, label) {
    const data = await request(endpoint);
    await reply(
        `╭━━〔 *${label}* 〕━━╮\n` +
        formatList(data.data) +
        `\n\n╰━━━━━━━━━━━━━━━━━━╯\n` +
        `© POWERED BY AHMED-MD`
    );
}

// ANIME SEARCH
register('anime', 'Search anime', async ({ q, reply }) => {
    if (!q) return reply('Example: .anime Naruto');

    const data = await request(
        `/anime?q=${encodeURIComponent(q)}&limit=10`
    );

    await reply(
        `🎬 *ANIME SEARCH: ${q}*\n` +
        formatList(data.data)
    );
});

// ANIME DETAILS
register('animeinfo', 'Anime information by MAL ID', async ({ q, reply }) => {
    if (!q || !/^\d+$/.test(q.trim())) {
        return reply('Example: .animeinfo 20');
    }

    const data = await request(`/anime/${q.trim}/full`);
    await reply(formatAnime(data.data));
});

// MANGA SEARCH
register('manga', 'Search manga', async ({ q, reply }) => {
    if (!q) return reply('Example: .manga One Piece');

    const data = await request(
        `/manga?q=${encodeURIComponent(q)}&limit=10`
    );

    await reply(
        `📚 *MANGA SEARCH: ${q}*\n` +
        formatList(data.data, 'manga')
    );
});

// MANGA DETAILS
register('mangainfo', 'Manga details by ID', async ({ q, reply }) => {
    if (!q || !/^\d+$/.test(q.trim())) {
        return reply('Example: .mangainfo 13');
    }

    const data = await request(`/manga/${q.trim}/full`);
    const a = data.data;

    await reply(
        `📚 *${title(a)}*\n\n` +
        `🆔 ID: ${a.mal_id}\n` +
        `⭐ Score: ${a.score || 'N/A'}\n` +
        `📖 Chapters: ${a.chapters ?? 'N/A'}\n` +
        `📚 Volumes: ${a.volumes ?? 'N/A'}\n` +
        `📡 Status: ${a.status || 'N/A'}\n\n` +
        `📝 ${limit(a.synopsis, 800)}\n\n` +
        `${a.url || ''}\n\n© POWERED BY AHMED-MD`
    );
});

// CHARACTER SEARCH
register('character', 'Search anime characters', async ({ q, reply }) => {
    if (!q) return reply('Example: .character Luffy');

    const data = await request(
        `/characters?q=${encodeURIComponent(q)}&limit=10`
    );

    await reply(
        `👤 *CHARACTER SEARCH*\n` +
        formatList(data.data)
    );
});

// CHARACTER DETAILS
register('characterinfo', 'Character details by ID', async ({ q, reply }) => {
    if (!q || !/^\d+$/.test(q.trim())) {
        return reply('Example: .characterinfo 40');
    }

    const data = await request(`/characters/${q.trim}/full`);
    const a = data.data;

    await reply(
        `👤 *${title(a)}*\n\n` +
        `🆔 ID: ${a.mal_id}\n` +
        `⭐ Favorites: ${a.favorites || 0}\n` +
        `📝 ${limit(a.about, 1000)}\n\n` +
        `${a.url || ''}\n\n© POWERED BY AHMED-MD`
    );
});

// PEOPLE SEARCH
register('person', 'Search voice actors and people', async ({ q, reply }) => {
    if (!q) return reply('Example: .person Masako Nozawa');

    const data = await request(
        `/people?q=${encodeURIComponent(q)}&limit=10`
    );

    await reply(
        `🎤 *PEOPLE SEARCH*\n` +
        formatList(data.data)
    );
});

// PRODUCER SEARCH
register('producer', 'Search anime producers', async ({ q, reply }) => {
    if (!q) return reply('Example: .producer MAPPA');

    const data = await request(
        `/producers?q=${encodeURIComponent(q)}&limit=10`
    );

    await reply(`🏢 *PRODUCERS*\n${formatList(data.data)}`);
});

// CLUB SEARCH
register('animeclub', 'Search anime clubs', async ({ q, reply }) => {
    if (!q) return reply('Example: .animeclub Naruto');

    const data = await request(
        `/clubs?q=${encodeURIComponent(q)}&limit=10`
    );

    await reply(`👥 *ANIME CLUBS*\n${formatList(data.data)}`);
});

// MAGAZINE SEARCH
register('magazine', 'Search manga magazines', async ({ q, reply }) => {
    if (!q) return reply('Example: .magazine Shonen Jump');

    const data = await request(
        `/magazines?q=${encodeURIComponent(q)}&limit=10`
    );

    await reply(`📖 *MAGAZINES*\n${formatList(data.data)}`);
});

// TOP ANIME
register('topanime', 'Top rated anime', async ({ reply }) => {
    await sendList(reply, '/top/anime?limit=10', 'TOP ANIME');
});

// TOP MANGA
register('topmanga', 'Top rated manga', async ({ reply }) => {
    await sendList(reply, '/top/manga?limit=10', 'TOP MANGA');
});

// TOP PEOPLE
register('toppeople', 'Top anime people', async ({ reply }) => {
    await sendList(reply, '/top/people?limit=10', 'TOP PEOPLE');
});

// TOP CHARACTERS
register('topcharacters', 'Top anime characters', async ({ reply }) => {
    await sendList(reply, '/top/characters?limit=10', 'TOP CHARACTERS');
});

// TOP REVIEWS
register('topreviews', 'Top anime reviews', async ({ reply }) => {
    const data = await request('/top/reviews?limit=10');

    const result = data.data.map((x, i) =>
        `${i + 1}. *${x.entry?.title || 'Unknown'}*\n` +
        `⭐ Score: ${x.score || 'N/A'}\n` +
        `📝 ${limit(x.review, 180)}\n` +
        `${x.url || ''}`
    ).join('\n\n');

    await reply(`📝 *TOP REVIEWS*\n\n${result}`);
});

// RANDOM ANIME
register('randomanime', 'Get random anime', async ({ reply }) => {
    const data = await request('/random/anime');
    await reply(formatAnime(data.data));
});

// RANDOM MANGA
register('randommanga', 'Get random manga', async ({ reply }) => {
    const data = await request('/random/manga');
    const a = data.data;

    await reply(
        `📚 *${title(a)}*\n\n` +
        `⭐ Score: ${a.score || 'N/A'}\n` +
        `📖 Chapters: ${a.chapters ?? 'N/A'}\n` +
        `📝 ${limit(a.synopsis, 700)}\n` +
        `${a.url || ''}`
    );
});

// RANDOM CHARACTER
register('randomcharacter', 'Get random character', async ({ reply }) => {
    const data = await request('/random/characters');
    const a = data.data;

    await reply(
        `👤 *${title(a)}*\n\n` +
        `⭐ Favorites: ${a.favorites || 0}\n` +
        `📝 ${limit(a.about, 700)}\n` +
        `${a.url || ''}`
    );
});

// RANDOM PERSON
register('randomperson', 'Get random person', async ({ reply }) => {
    const data = await request('/random/people');
    const a = data.data;

    await reply(
        `🎤 *${title(a)}*\n\n` +
        `⭐ Favorites: ${a.favorites || 0}\n` +
        `📝 ${limit(a.about, 700)}\n` +
        `${a.url || ''}`
    );
});

// CURRENT SEASON
register('seasonanime', 'Current season anime', async ({ reply }) => {
    await sendList(reply, '/seasons/now?limit=10', 'CURRENT SEASON');
});

// UPCOMING ANIME
register('upcominganime', 'Upcoming anime', async ({ reply }) => {
    await sendList(reply, '/seasons/upcoming?limit=10', 'UPCOMING ANIME');
});

// SEASON SEARCH
register('season', 'Anime season by year and name', async ({ q, reply }) => {
    const args = q.trim().split(/\s+/);
    const year = args[0];
    const season = args[1]?.toLowerCase();

    if (!/^\d{4}$/.test(year) ||
        !['winter', 'spring', 'summer', 'fall'].includes(season)) {
        return reply('Example: .season 2026 winter');
    }

    await sendList(
        reply,
        `/seasons/${year}/${season}?limit=10`,
        `${year} ${season.toUpperCase()}`
    );
});

// ANIME SCHEDULE
register('animeschedule', 'Anime airing schedule', async ({ q, reply }) => {
    const days = [
        'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday'
    ];

    const day = q.trim().toLowerCase();

    if (day && !days.includes(day)) {
        return reply('Example: .animeschedule monday');
    }

    const endpoint = day
        ? `/schedules?filter=${day}&limit=10`
        : '/schedules?limit=10';

    await sendList(reply, endpoint, 'ANIME SCHEDULE');
});

// ANIME RECOMMENDATIONS
register('animerec', 'Anime recommendations', async ({ q, reply }) => {
    if (!q || !/^\d+$/.test(q.trim())) {
        return reply('Example: .animerec 20');
    }

    const data = await request(`/anime/${q.trim}/recommendations`);

    const result = data.data.slice(0, 10).map((x, i) =>
        `${i + 1}. *${x.entry.title}*\n` +
        `⭐ Votes: ${x.votes}\n` +
        `${x.entry.url}`
    ).join('\n\n');

    await reply(`✨ *ANIME RECOMMENDATIONS*\n\n${result || 'No recommendations found.'}`);
});

// MANGA RECOMMENDATIONS
register('mangarec', 'Manga recommendations', async ({ q, reply }) => {
    if (!q || !/^\d+$/.test(q.trim())) {
        return reply('Example: .mangarec 13');
    }

    const data = await request(`/manga/${q.trim}/recommendations`);

    const result = data.data.slice(0, 10).map((x, i) =>
        `${i + 1}. *${x.entry.title}*\n` +
        `⭐ Votes: ${x.votes}\n` +
        `${x.entry.url}`
    ).join('\n\n');

    await reply(`📚 *MANGA RECOMMENDATIONS*\n\n${result || 'No recommendations found.'}`);
});

// ANIME REVIEWS
register('animereviews', 'Anime reviews by ID', async ({ q, reply }) => {
    if (!q || !/^\d+$/.test(q.trim())) {
        return reply('Example: .animereviews 20');
    }

    const data = await request(`/anime/${q.trim}/reviews`);

    const result = data.data.slice(0, 5).map((x, i) =>
        `${i + 1}. *${x.user?.username || 'User'}*\n` +
        `⭐ Score: ${x.score || 'N/A'}\n` +
        `📝 ${limit(x.review, 350)}\n` +
        `${x.url || ''}`
    ).join('\n\n');

    await reply(`📝 *ANIME REVIEWS*\n\n${result || 'No reviews found.'}`);
});

// MANGA REVIEWS
register('mangareviews', 'Manga reviews by ID', async ({ q, reply }) => {
    if (!q || !/^\d+$/.test(q.trim())) {
        return reply('Example: .mangareviews 13');
    }

    const data = await request(`/manga/${q.trim}/reviews`);

    const result = data.data.slice(0, 5).map((x, i) =>
        `${i + 1}. *${x.user?.username || 'User'}*\n` +
        `⭐ Score: ${x.score || 'N/A'}\n` +
        `📝 ${limit(x.review, 350)}\n` +
        `${x.url || ''}`
    ).join('\n\n');

    await reply(`📚 *MANGA REVIEWS*\n\n${result || 'No reviews found.'}`);
});

// ANIME GENRES
register('animegenres', 'List anime genres', async ({ reply }) => {
    const data = await request('/genres/anime');

    const result = data.data.map(x =>
        `• ${x.name} (ID: ${x.mal_id})`
    ).join('\n');

    await reply(`🎭 *ANIME GENRES*\n\n${result}`);
});

// MANGA GENRES
register('mangagenres', 'List manga genres', async ({ reply }) => {
    const data = await request('/genres/manga');

    const result = data.data.map(x =>
        `• ${x.name} (ID: ${x.mal_id})`
    ).join('\n');

    await reply(`📚 *MANGA GENRES*\n\n${result}`);
});

// WATCH EPISODES
register('watchepisodes', 'Recent anime episodes', async ({ reply }) => {
    const data = await request('/watch/episodes?limit=10');

    const result = data.data.map((x, i) =>
        `${i + 1}. *${x.entry?.title || 'Unknown'}*\n` +
        `📺 Episode: ${x.episodes?.[0]?.title || 'N/A'}\n` +
        `🔗 ${x.entry?.url || ''}`
    ).join('\n\n');

    await reply(`📺 *RECENT EPISODES*\n\n${result || 'No results found.'}`);
});

// POPULAR EPISODES
register('popularepisodes', 'Popular anime episodes', async ({ reply }) => {
    const data = await request('/watch/episodes/popular?limit=10');

    const result = data.data.map((x, i) =>
        `${i + 1}. *${x.entry?.title || 'Unknown'}*\n` +
        `📺 ${x.episodes?.[0]?.title || 'N/A'}\n` +
        `🔗 ${x.entry?.url || ''}`
    ).join('\n\n');

    await reply(`🔥 *POPULAR EPISODES*\n\n${result || 'No results found.'}`);
});

// WATCH PROMOS
register('watchpromo', 'Recent anime promos', async ({ reply }) => {
    const data = await request('/watch/promos?limit=10');

    const result = data.data.map((x, i) =>
        `${i + 1}. *${x.entry?.title || 'Unknown'}*\n` +
        `🎬 ${x.title || 'Promo'}\n` +
        `🔗 ${x.trailer?.url || x.entry?.url || ''}`
    ).join('\n\n');

    await reply(`🎬 *ANIME PROMOS*\n\n${result || 'No promos found.'}`);
});

// POPULAR PROMOS
register('popularpromo', 'Popular anime promos', async ({ reply }) => {
    const data = await request('/watch/promos/popular?limit=10');

    const result = data.data.map((x, i) =>
        `${i + 1}. *${x.entry?.title || 'Unknown'}*\n` +
        `🎬 ${x.title || 'Promo'}\n` +
        `🔗 ${x.trailer?.url || x.entry?.url || ''}`
    ).join('\n\n');

    await reply(`🔥 *POPULAR PROMOS*\n\n${result || 'No promos found.'}`);
});

// MAL USER
register('maluser', 'MyAnimeList user information', async ({ q, reply }) => {
    if (!q) return reply('Example: .maluser username');

    const data = await request(
        `/users/${encodeURIComponent(q.trim())}/full`
    );

    const a = data.data;

    await reply(
        `👤 *MYANIMELIST USER*\n\n` +
        `Name: ${a.username}\n` +
        `ID: ${a.mal_id}\n` +
        `Gender: ${a.gender || 'N/A'}\n` +
        `Location: ${a.location || 'N/A'}\n` +
        `Joined: ${a.joined || 'N/A'}\n` +
        `Birthday: ${a.birthday || 'N/A'}\n` +
        `${a.url || ''}\n\n© POWERED BY AHMED-MD`
    );
});

// HELP
register('animehelp', 'Show anime commands', async ({ reply }) => {
    await reply(
        `╭━━〔 *AHMED-MD ANIME* 〕━━╮\n` +
        `┃\n` +
        `┃ 🎬 *SEARCH*\n` +
        `┃ .anime Naruto\n` +
        `┃ .animeinfo 20\n` +
        `┃ .manga One Piece\n` +
        `┃ .mangainfo 13\n` +
        `┃ .character Luffy\n` +
        `┃ .characterinfo 40\n` +
        `┃ .person name\n` +
        `┃ .producer name\n` +
        `┃ .animeclub name\n` +
        `┃ .magazine name\n` +
        `┃\n` +
        `┃ 🏆 *TOP & RANDOM*\n` +
        `┃ .topanime\n` +
        `┃ .topmanga\n` +
        `┃ .toppeople\n` +
        `┃ .topcharacters\n` +
        `┃ .topreviews\n` +
        `┃ .randomanime\n` +
        `┃ .randommanga\n` +
        `┃ .randomcharacter\n` +
        `┃ .randomperson\n` +
        `┃\n` +
        `┃ 📅 *SEASONS & WATCH*\n` +
        `┃ .seasonanime\n` +
        `┃ .upcominganime\n` +
        `┃ .season 2026 winter\n` +
        `┃ .animeschedule monday\n` +
        `┃ .watchepisodes\n` +
        `┃ .popularepisodes\n` +
        `┃ .watchpromo\n` +
        `┃ .popularpromo\n` +
        `┃\n` +
        `┃ ✨ *MORE*\n` +
        `┃ .animerec 20\n` +
        `┃ .mangarec 13\n` +
        `┃ .animereviews 20\n` +
        `┃ .mangareviews 13\n` +
        `┃ .animegenres\n` +
        `┃ .mangagenres\n` +
        `┃ .maluser username\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━━━╯\n` +
        `© POWERED BY AHMED-MD`
    );
});

console.log('[AHMED-MD] Jikan Anime Plugin Loaded');
