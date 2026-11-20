
const { cmd } = require('../command')

const POWERED_BY = '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'

cmd({
    pattern: 'age',
    desc: 'Calculate age from date of birth',
    category: 'tools',
    react: '🎂',
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        if (!q) {
            return reply(
                `Please provide your date of birth.\n\nExample:\n.age 11-07-2007\n.age 11/07/2007\n\n${POWERED_BY}`
            )
        }

        const parts = q.trim().split(/[-/]/)

        if (parts.length !== 3) {
            return reply(`❌ Invalid date format.\nUse: DD-MM-YYYY\n\n${POWERED_BY}`)
        }

        const day = Number(parts[0])
        const month = Number(parts[1])
        const year = Number(parts[2])

        if (
            !Number.isInteger(day) ||
            !Number.isInteger(month) ||
            !Number.isInteger(year) ||
            year < 1900 ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            return reply(`❌ Invalid date of birth.\n\n${POWERED_BY}`)
        }

        const birthDate = new Date(year, month - 1, day)

        if (
            birthDate.getFullYear() !== year ||
            birthDate.getMonth() !== month - 1 ||
            birthDate.getDate() !== day
        ) {
            return reply(`❌ This date does not exist.\n\n${POWERED_BY}`)
        }

        const today = new Date()

        if (birthDate > today) {
            return reply(`❌ Date of birth cannot be in the future.\n\n${POWERED_BY}`)
        }

        let years = today.getFullYear() - year
        let months = today.getMonth() - (month - 1)
        let days = today.getDate() - day

        if (days < 0) {
            months--
            const previousMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                0
            )
            days += previousMonth.getDate()
        }

        if (months < 0) {
            years--
            months += 12
        }

        return reply(
            `╭━━〔 🎂 AGE CALCULATOR 〕━━╮\n` +
            `┃\n` +
            `┃ 📅 Date of Birth: ${day}-${month}-${year}\n` +
            `┃\n` +
            `┃ 🎉 Age: ${years} Years\n` +
            `┃ 📆 Months: ${months}\n` +
            `┃ 📍 Days: ${days}\n` +
            `┃\n` +
            `╰━━━━━━━━━━━━━━━━━━╯\n\n${POWERED_BY}`
        )

    } catch (error) {
        console.error('AGE ERROR:', error)
        return reply(`❌ Error: ${error.message}\n\n${POWERED_BY}`)
    }
})
