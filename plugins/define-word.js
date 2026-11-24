const { cmd } = require('../command')
const axios = require('axios')

cmd({
    pattern: 'define',
    desc: 'Get the definition of a word',
    category: 'utility',
    react: '🔍',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
`╭━━〔 📖 AHMED-MD DEFINE 〕━━╮
┃
┃ ✦ .define Word
┃ ✦ Example: .define love
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
            )
        }

        const word = q.trim().split(' ')[0]
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`

        const response = await axios.get(url, { timeout: 30000 })
        const definitionData = response.data[0]

        if (!definitionData) return reply('❌ Word not found.')

        const meaning = definitionData.meanings?.[0]
        const def = meaning?.definitions?.[0]

        const definition = def?.definition || 'N/A'
        const example = def?.example || 'No example available'
        const synonyms = def?.synonyms?.length ? def.synonyms.join(', ') : 'No synonyms available'
        const phonetics = definitionData.phonetics?.find(p => p.text)?.text || 'No phonetics available'
        const audio = definitionData.phonetics?.find(p => p.audio)?.audio || null
        const partOfSpeech = meaning?.partOfSpeech || 'N/A'

        const wordInfo = `╭━━〔 📖 AHMED-MD 〕━━╮
┃
┃ 📖 *Word:* ${definitionData.word}
┃ 🗣️ *Pronunciation:* ${phonetics}
┃ 📚 *Type:* ${partOfSpeech}
┃ 📝 *Definition:* ${definition}
┃ ✍️ *Example:* ${example}
┃ 🔁 *Synonyms:* ${synonyms}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`

        await reply(wordInfo)

        if (audio) {
            await conn.sendMessage(from, { audio: { url: audio }, mimetype: 'audio/mpeg' }, { quoted: mek })
        }

    } catch (e) {
        console.log('AHMED-MD DEFINE ERROR:', e.message)
        if (e.response && e.response.status === 404) {
            return reply('❌ *Word not found.* Spelling check karke dobara try karo.')
        }
        reply(`❌ *Define Failed*\n\nDobara try karo.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
})
