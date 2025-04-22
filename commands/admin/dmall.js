const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dmall')
    .setDescription('Send a DM to all members in the server')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const messageToSend = interaction.options.getString('message');
    const guild = interaction.guild;

    await interaction.reply({
      content: 'Starting to send DMs to members...',
      ephemeral: true,
    });

    const members = await guild.members.fetch();
    const allMembers = members.filter(m => !m.user.bot);

    const batchSize = 10;
    const delayBetweenBatches = Math.floor(Math.random() * (5 - 2 + 1) + 2) * 60 * 1000;

    let sent = 0;
    let failed = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const memberChunks = Array.from(allMembers.values()).reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / batchSize);
      if (!resultArray[chunkIndex]) resultArray[chunkIndex] = [];
      resultArray[chunkIndex].push(item);
      return resultArray;
    }, []);

    for (const [i, batch] of memberChunks.entries()) {
      console.log(`Sending batch ${i + 1}/${memberChunks.length}...`);

      for (const member of batch) {
        try {
          await member.send(messageToSend);
          sent++;
        } catch (err) {
          failed++;
          if (err.code === 50007) {
            console.warn(`❌ Can't DM ${member.user.tag} — DMs closed.`);
          } else {
            console.error(`Failed to DM ${member.user.tag}:`, err);
          }
        }

        await sleep(1500);
      }

      if (i < memberChunks.length - 1) {
        const delay = Math.floor(Math.random() * (5 - 2 + 1) + 2) * 60 * 1000;
        console.log(`Waiting ${Math.floor(delay / 60000)} minutes before next batch...`);
        await sleep(delay);
      }
    }

    console.log(`Finished sending DMs. Sent: ${sent}, Failed: ${failed}`);
    await interaction.followUp({ content: `DMs sent \nSuccess: ${sent}\nFailed: ${failed}`, ephemeral: true });
  },
};
