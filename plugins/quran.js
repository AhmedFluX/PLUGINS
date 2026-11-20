
const { bot } = require('../lib')
const net = require('net')

if (net.getDefaultAutoSelectFamilyAttemptTimeout?.() < 1000)
    net.setDefaultAutoSelectFamilyAttemptTimeout(1000)

const API = 'https://api.alquran.cloud/v1'
const EDITIONS = 'quran-uthmani,en.asad'
const MAX_RANGE = 50
const MAX_MSG = 30000

const NAMES = "Al-Faatiha,Al-Baqara,Aal-i-Imraan,An-Nisaa,Al-Maaida,Al-An'aam,Al-A'raaf,Al-Anfaal,At-Tawba,Yunus,Hud,Yusuf,Ar-Ra'd,Ibrahim,Al-Hijr,An-Nahl,Al-Israa,Al-Kahf,Maryam,Taa-Haa,Al-Anbiyaa,Al-Hajj,Al-Muminoon,An-Noor,Al-Furqaan,Ash-Shu'araa,An-Naml,Al-Qasas,Al-Ankaboot,Ar-Room,Luqman,As-Sajda,Al-Ahzaab,Saba,Faatir,Yaseen,As-Saaffaat,Saad,Az-Zumar,Ghafir,Fussilat,Ash-Shura,Az-Zukhruf,Ad-Dukhaan,Al-Jaathiya,Al-Ahqaf,Muhammad,Al-Fath,Al-Hujuraat,Qaaf,Adh-Dhaariyat,At-Tur,An-Najm,Al-Qamar,Ar-Rahmaan,Al-Waaqia,Al-Hadid,Al-Mujaadila,Al-Hashr,Al-Mumtahana,As-Saff,Al-Jumu'a,Al-Munaafiqoon,At-Taghaabun,At-Talaaq,At-Tahrim,Al-Mulk,Al-Qalam,Al-Haaqqa,Al-Ma'aarij,Nooh,Al-Jinn,Al-Muzzammil,Al-Muddaththir,Al-Qiyaama,Al-Insaan,Al-Mursalaat,An-Naba,An-Naazi'aat,Abasa,At-Takwir,Al-Infitaar,Al-Mutaffifin,Al-Inshiqaaq,Al-Burooj,At-Taariq,Al-A'laa,Al-Ghaashiya,Al-Fajr,Al-Balad,Ash-Shams,Al-Lail,Ad-Dhuhaa,Ash-Sharh,At-Tin,Al-Alaq,Al-Qadr,Al-Bayyina,Az-Zalzala,Al-Aadiyaat,Al-Qaari'a,At-Takaathur,Al-Asr,Al-Humaza,Al-Fil,Quraish,Al-Maa'un,Al-Kawthar,Al-Kaafiroon,An-Nasr,Al-Masad,Al-Ikhlaas,Al-Falaq,An-Naas".split(',')

const AYAHS = '7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6'.split(',').map(Number)

const norm = (s) =>
    s.toLowerCase().trim()
        .replace(/^a[a-z]{1,2}[-\s]/, '')
        .replace(/[^a-z]/g, '')
        .replace(/ee/g, 'i').replace(/oo/g, 'u')
        .replace(/(.)\1+/g, '$1')
        .replace(/([aeiou])h$/, '$1')

const NORMED = NAMES.map(norm)

const absolute = (surah, ayah) =>
    AYAHS.slice(0, surah - 1).reduce((a, b) => a + b, 0) + ayah

function locate(n) {
    let s = 0
    while (n > AYAHS[s]) n -= AYAHS[s++]
    return [s + 1, n]
}

function surahOf(ref) {
    ref = String(ref || '').trim()
    if (!ref) throw new Error('Please provide a surah number (1-114) or name')

    if (/^\d+$/.test(ref)) {
        const n = Number(ref)
        if (n < 1 || n > 114)
            throw new Error('Surah number should be between 1 and 114')
        return n
    }

    const q = norm(ref)
    let i = NORMED.indexOf(q)

    if (i < 0 && q.length >= 3)
        i = NORMED.findIndex((n) => n.startsWith(q))

    if (i < 0)
        throw new Error(`Unknown surah "${ref}". Use its number (1-114)`)

    return i + 1
}

function refOf(text) {
    const m = String(text || '').trim().match(/^(.+?)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/)

    if (!m)
        throw new Error('Please provide surah:ayah, e.g. 2:255 or 2:255-257')

    const surah = surahOf(m[1])
    const from = Number(m[2])
    const to = m[3] ? Number(m[3]) : from
    const count = AYAHS[surah - 1]

    if (from < 1 || to > count || to < from)
        throw new Error(`${NAMES[surah - 1]} has ${count} ayahs (1-${count})`)

    if (to - from + 1 > MAX_RANGE)
        throw new Error(`Max ${MAX_RANGE} ayahs at a time. Use .quran surah ${surah} for the whole surah`)

    return { surah, from, to }
}

async function api(path) {
    const res = await fetch(API + path, {
        signal: AbortSignal.timeout(30000)
    })

    const json = await res.json().catch(() => ({}))

    if (json.code !== 200)
        throw new Error(`Quran API error (${res.status}), try again later`)

    return json.data
}

const fetchRange = (surah, from, count) =>
    api(`/surah/${surah}/editions/${EDITIONS}?offset=${from - 1}&limit=${count}`)

const verses = ([ar, en]) =>
    ar.ayahs.map((a, i) =>
        `*﴿${a.numberInSurah}﴾* ${a.text}\n${en.ayahs[i].text}\n\n`
    )

function chunk(parts) {
    const out = ['']

    for (const p of parts) {
        if (out[out.length - 1] && out[out.length - 1].length + p.length > MAX_MSG)
            out.push('')

        out[out.length - 1] += p
    }

    return out.map((s) => s.trim())
}

async function sendAyahs(message, surah, from, to) {
    const data = await fetchRange(surah, from, to - from + 1)
    const range = from === to ? `${surah}:${from}` : `${surah}:${from}-${to}`
    const head = `*${data[0].englishName}* · ${data[0].name} · ${range}\n\n`

    const [first, ...rest] = chunk([
        head,
        ...verses(data),
        `_— ${data[1].edition.englishName}_`,
        '\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'
    ])

    await message.send(first)

    for (const part of rest)
        await message.send(part)
}

async function sendAudio(message, url, fileName) {
    try {
        await message.sendFromUrl(url, {
            mimetype: 'audio/mpeg',
            fileName,
            quoted: message.data
        })

        await message.send('*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*')
    } catch (e) {
        await message.send(`Couldn't send the audio here, listen/download:\n${url}\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`)
    }
}

function help(p) {
    return [
        '*Quran commands*',
        `${p}quran — random ayah`,
        `${p}quran 2:255 — an ayah (Arabic + English)`,
        `${p}quran 2:255-257 — a range (max ${MAX_RANGE})`,
        `${p}quran yaseen:1-5 — surah names work too`,
        `${p}quran surah 36 — whole surah (or ${p}quran surah yaseen)`,
        `${p}quran audio 36 — surah recitation (Mishary Alafasy)`,
        `${p}quran audio 2:255 — one ayah recitation`,
        `${p}quran how — help`,
        '',
        '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'
    ].join('\n')
}

bot(
    {
        pattern: 'quran ?(.*)',
        fromMe: true,
        desc: 'Quran ayahs, surahs and recitation. .quran how for help',
        type: 'quran',
    },
    async (message, match) => {
        const text = (match || '').trim()
        const [cmd = '', ...args] = text.split(/\s+/)
        const rest = args.join(' ')
        const prefix = /^[^\w\s]/.test(message.text || '') ? message.text[0] : '.'

        try {
            switch (cmd.toLowerCase()) {
                case '':
                    {
                        const [s, a] = locate(Math.floor(Math.random() * 6236) + 1)
                        return await sendAyahs(message, s, a, a)
                    }

                case 'how':
                case 'help':
                    return await message.send(help(prefix))

                case 'ayah':
                    {
                        const { surah, from, to } = refOf(rest)
                        return await sendAyahs(message, surah, from, to)
                    }

                case 'surah':
                    {
                        const surah = surahOf(rest)
                        const data = await fetchRange(surah, 1, AYAHS[surah - 1])
                        const s = data[0]

                        const head = `*${s.name}* · ${s.englishName} (${s.englishNameTranslation})\n*Surah*: ${s.number}\n*Revelation Type*: ${s.revelationType}\n*Ayahs*: ${s.numberOfAyahs}\n\n`

                        for (const part of chunk([
                            head,
                            ...verses(data),
                            `_— ${data[1].edition.englishName}_`,
                            '\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'
                        ])) {
                            await message.send(part)
                        }

                        return
                    }

                case 'audio':
                    if (rest.includes(':')) {
                        const { surah, from } = refOf(rest)

                        return await sendAudio(
                            message,
                            `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${absolute(surah, from)}.mp3`,
                            `${NAMES[surah - 1]} ${surah}-${from}.mp3`
                        )
                    } else {
                        const surah = surahOf(rest)

                        return await sendAudio(
                            message,
                            `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surah}.mp3`,
                            `${surah}. ${NAMES[surah - 1]}.mp3`
                        )
                    }

                default:
                    if (text.includes(':')) {
                        const { surah, from, to } = refOf(text)
                        return await sendAyahs(message, surah, from, to)
                    }

                    return await message.send(help(prefix))
            }
        } catch (e) {
            return await message.send(`❌ ${e.message}\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`)
        }
    }
)
