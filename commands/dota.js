const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dota")
    .setDescription("Pings all dota people")
    .addIntegerOption((option) =>
      option
        .setName("input")
        .setDescription("The minimum number of people you need to play")
        .setRequired(true)
    ),
  async execute(interaction) {
    let stackSize = interaction.options.getInteger("input");
    const message = await interaction.reply({
      content: ` Hello dota friends, ${interaction.user.username} would like to play with a stack size of ${stackSize}! Please react if you'd like to be pinged when a stack forms. If you initiated the command, I have reacted for you.`,
      fetchReply: true,
    });
    /*const reactionEmoji = message.guild.emojis.cache.find(
      (emoji) => emoji.name === "dotes"
    );*/
    message.react("👍");
    const filter = (reaction, user) => {
      return ["👍"].includes(reaction.emoji.name);
    };
    const timeOut = 600000; //in ms 600000 = 10 min
    const collector = message.createReactionCollector({
      filter,
      time: timeOut,
    });
    let idArray = [];
    collector.on("collect", (reaction, user) => {
      if (user != interaction.user) {
        idArray.push(user.id);
      }
      if (idArray.length == stackSize) {
        collector.stop();
      }
    });

    collector.on("end", (collected) => {
      idArray.shift();
      idArray.push(interaction.user.id);
      if (idArray.length == stackSize) {
        let replyMessage = `It's time to play!`;
        for (let i = 0; i < idArray.length; i++) {
          replyMessage = replyMessage.concat(` `, `<@${idArray[i]}>`);
          console.log(replyMessage);
        }
        message.reply(replyMessage);
      } else {
        message.reply("Not enough for a stack right now. Try again later!");
      }
    });
  },
};
