
const { cmd } = require('../command')

const BASE = 'https://api.alquran.cloud/v1'
const FOOTER = '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'

async function getQuran(endpoint) {
    const response = await fetch(`${BASE}${endpoint}`)

    if (!response.ok) {
        throw new Error('Quran API request failed')
    }

    const json = await response.json()

    if (json.code !== 200 || !json.data) {
        throw new Error('Quran data not found')
    }

    return json.data
}

function formatAyah(arabic, english, reference) {
    return `﴿ ${arabic} ﴾

${english}

📖 *Reference:* ${reference}

${FOOTER}`
}

cmd({
    pattern: 'quran',
    alias: ['surah'],
    desc: 'Read Quran with translation and audio',
    category: 'islamic',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const input = (q || '').trim()

        if (!input) {
            const random = await getQuran(
                '/ayah/random/editions/quran-uthmani,en.asad'
            )

            const arabic = random[0]
            const english = random[1]

            return reply(formatAyah(
                arabic.text,
                english.text,
                `${arabic.surah.englishName} ${arabic.numberInSurah}`
            ))
        }

        // AUDIO COMMAND
        if (input.toLowerCase().startsWith('audio ')) {
            const ref = input.substring(6).trim()

            if (!ref) {
                return reply(`Example: .quran audio 1\n\n${FOOTER}`)
            }

            let audioUrl

            if (/^\d+$/.test(ref)) {
                const surah = parseInt(ref)

                if (surah < 1 || surah > 114) {
                    return reply(`Invalid Surah number.\n\n${FOOTER}`)
                }

                const surahData = await getQuran(`/surah/${surah}`)

                await reply(
                    `🎧 *Playing Surah ${surahData.englishName}*\n\n${FOOTER}`
                )

                for (let i = 1; i <= surahData.numberOfAyahs; i++) {
                    const ayahNumber = surahData.ayahs[i - 1].number
                    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumber}.mp3`

                    await conn.sendMessage(from, {
                        audio: { url },
                        mimetype: 'audio/mpeg',
                        ptt: false
                    }, { quoted: mek })
                }

                return
            }

            if (!/^\d+:\d+$/.test(ref)) {
                return reply(`Use: .quran audio 2:255\n\n${FOOTER}`)
            }

            const ayah = await getQuran(`/ayah/${ref}`)
            audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`

            await conn.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: mek })

            return
        }

        // AYAH RANGE
        if (/^\d+:\d+-\d+$/.test(input)) {
            const [surahNumber, range] = input.split(':')
            const [start, end] = range.split('-').map(Number)

            if (end < start || end - start > 20) {
                return reply(`Maximum 21 ayahs per request.\n\n${FOOTER}`)
            }

            const surah = await getQuran(
                `/surah/${surahNumber}/editions/quran-uthmani,en.asad`
            )

            if (start < 1 || end > surah[0].numberOfAyahs) {
                return reply(`Invalid ayah range.\n\n${FOOTER}`)
            }

            let output = ''

            for (let i = start; i <= end; i++) {
                const arabic = surah[0].ayahs[i - 1]
                const english = surah[1].ayahs[i - 1]

                output += `\n\n*${i}.* ${arabic.text}\n${english.text}`
            }

            return reply(
                `📖 *${surah[0].englishName}*\n${output}\n\n${FOOTER}`
            )
        }

        // SPECIFIC AYAH
        if (/^\d+:\d+$/.test(input)) {
            const data = await getQuran(
                `/ayah/${input}/editions/quran-uthmani,en.asad`
            )

            return reply(formatAyah(
                data[0].text,
                data[1].text,
                `${data[0].surah.englishName} ${input}`
            ))
        }

        // COMPLETE SURAH
        if (/^\d+$/.test(input)) {
            const number = parseInt(input)

            if (number < 1 || number > 114) {
                return reply(`Surah number must be 1-114.\n\n${FOOTER}`)
            }

            const data = await getQuran(
                `/surah/${number}/editions/quran-uthmani,en.asad`
            )

            let output = `📖 *${data[0].englishName}*\n`
            output += `*${data[0].englishNameTranslation}*\n`

            for (let i = 0; i < data[0].ayahs.length; i++) {
                output += `\n\n*${i + 1}.* ${data[0].ayahs[i].text}\n`
                output += `${data[1].ayahs[i].text}`
            }

            output += `\n\n${FOOTER}`

            return reply(output)
        }

        return reply(
            `📖 *QURAN COMMANDS*

.quran
Random Ayah

.quran 2:255
Specific Ayah

.quran 2:1-5
Ayah Range

.quran 1
Complete Surah

.quran audio 1
Surah Audio

.quran audio 2:255
Ayah Audio

${FOOTER}`
        )

    } catch (error) {
        console.error('QURAN ERROR:', error)
        return reply(`❌ Quran request failed. Try again.\n\n${FOOTER}`)
    }
})
