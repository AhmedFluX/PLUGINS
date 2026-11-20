
const { bot } = require('../lib/');

bot(
    {
        pattern: 'age ?(.*)',
        fromMe: true,
        desc: 'Age Calculator',
        type: 'misc',
    },
    async (message, match) => {
        if (!match) {
            return await message.send('*Example :* 1998-01-01');
        }

        const birthDate = new Date(match);
        const currentDate = new Date();

        if (isNaN(birthDate.getTime()) || birthDate > currentDate) {
            return await message.send('*Invalid date! Please use YYYY-MM-DD format.*');
        }

        let ageInMilliseconds = currentDate - birthDate;
        let ageInSeconds = ageInMilliseconds / 1000;
        let ageInMinutes = ageInSeconds / 60;
        let ageInHours = ageInMinutes / 60;
        let ageInDays = ageInHours / 24;

        const years = Math.floor(ageInDays / 365);
        const months = Math.floor((ageInDays % 365) / 30);
        const days = Math.floor(ageInDays % 30);
        const hours = Math.floor(ageInHours % 24);
        const minutes = Math.floor(ageInMinutes % 60);
        const seconds = Math.floor(ageInSeconds % 60);

        return await message.send(`Your age is:

*Years:* ${years}
*Months:* ${months}
*Days:* ${days}
*Hours:* ${hours}
*Minutes:* ${minutes}
*Seconds:* ${seconds}

*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`);
    }
);
