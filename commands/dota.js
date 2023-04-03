const {
  SlashCommandBuilder,
  Client,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dota")
    .setDescription("Pings all dota people")
    .addIntegerOption((option) =>
      option
        .setName("stacksize")
        .setDescription("The minimum number of people you need to play")
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption((option) =>
      option
        .setName("timeout")
        .setDescription("How long you're willing to wait - in minutes")
        .setRequired(true)
        .setMaxValue(30)
        .setMinValue(5)
    ),
  async execute(interaction) {
    let stackSize = interaction.options.getInteger("stacksize");
    let timeOutInMin = interaction.options.getInteger("timeout");
    let timeOutInMS = timeOutInMin * 60000;
    const role = interaction.guild.roles.cache.find(
      (role) => role.id === "1071259658943217745"
    );
    /*
    const reactionEmoji = interaction.guild.emojis.cache.find(
      (emoji) => emoji.name === "dotes"
    );
    */
    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = currentTime + timeOutInMin * 60;
    //const formattedStartTime = `<t:${currentTime}:F>`;
    const formattedEndTime = `<t:${endTime}:R>`;
    console.log(currentTime + ", " + endTime);

    var joinLabel = "Join stack";
    var leaveLabel = "Leave the stack"

    const joinButton = new ButtonBuilder()
      .setCustomId("join_dota")
      .setLabel(joinLabel)
      .setStyle(ButtonStyle.Primary);

    const leaveButton = new ButtonBuilder()
      .setCustomId("leave_dota")
      .setLabel(leaveLabel)
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(joinButton, leaveButton);

    const message = await interaction.reply({
      content:
        `Hello <@&${role.id}>, **${interaction.user.username}** would like to play with a **stack of ${stackSize}** ${formattedEndTime}! Please click below if you'd like to be pinged when a stack forms. \n*(` +
        interaction.user.username +
        `, I have reacted for you. But not anymore cuz its a button but you don't have to click it.)*`,
      fetchReply: true,
      components: [row],
    });

    const collector = message.createMessageComponentCollector({
      ComponentType: ComponentType.Button,
      time: timeOutInMS,
    });

    let idArray = [];
    let usernameArray = [];
    let replyMessage = '';
    idArray.push(interaction.user.id);

    //Declarring various content variables
    //Base messages
    let replyPlayingListBase = `So far the following ${usernameArray.length} people have said they will play: \n - ${interaction.user.username}`;
    let replyStackSuccess = `It's time to play!`;

    //Join button responses
    let replyJoinThanks = `Thanks for clicking! I'll notify you if/when a stack forms`;
    let replyJoinOwner = `I told you that you didn't have to click on it, dummy.`;
    let replyAlreadyJoined = `Don't be greedy, you've already clicked once.`;

    //Leave button responses
    let replyLeaveNotJoined = `You haven't even said you could play yet!`;
    let replyStackTimeout = `Not enough for a stack right now. Try again later!`;
    let replyLeaveSad = `Please, don't go.`;

    //Button collector functions
    collector.on("collect", (i) => {
      //first we handle the join button
      if (i.customId == "join_dota") {
        if (!idArray.includes(i.user.id)) {
          idArray.push(i.user.id);
          usernameArray.push(i.user.username);
          i.reply({
            content: replyJoinThanks,
            ephemeral: true,
          });

          replyMessage = replyPlayingListBase;
          
          for (let i = 0; i < usernameArray.length; i++) {
            replyMessage = replyMessage.concat(`\n - `, `${usernameArray[i]}`);
          }
          message.edit(
            `Hello <@&${role.id}>, **${interaction.user.username}** would like to play with a **stack of ${stackSize}** ${formattedEndTime}! Please react if you'd like to be pinged when a stack forms. ${replyMessage}`
          );
        } else if (i.user == interaction.user) {
          i.reply({
            content: replyJoinOwner,
            ephemeral: true,
          });
        } else if (idArray.includes(i.user.id)) {
          i.reply({
            content: replyAlreadyJoined,
            ephemeral: true,
          });
        }
        if (idArray.length == stackSize) {
          collector.stop();
        }
      }
      //and the code to handle clicking the leave button
      if (i.customId == "leave_dota") {
        if (idArray.includes(i.user.id)) {
          let index = idArray.indexOf(i.user.id);
          idArray.splice(index, 1);
          index = usernameArray.indexOf(i.user.username);

          //we don't let the stack creator bail on the stack
          if(i.user == interaction.user) {
            i.reply({
              content: replyLeaveOwner,
              ephemeral: true,
            });
          } else {
            usernameArray.splice(index, 1);
            i.reply({
              content: replyLeaveSad,
              ephemeral: true,
            });
          }

          replyMessage = replyPlayingListBase;
          
          for (let i = 0; i < usernameArray.length; i++) {
            replyMessage = replyMessage.concat(` `, `${usernameArray[i]}`);
          }
          message.edit(
            `Hello <@&${role.id}>, **${interaction.user.username}** would like to play with a **stack of ${stackSize}** ${formattedEndTime}! Please react if you'd like to be pinged when a stack forms. ${replyMessage}`
          );
        } else {
          i.reply({
            content: replyLeaveNotJoined,
            ephemeral: true,
          });
        }
      }
    });

    collector.on("end", (collected) => {
      if (idArray.length == stackSize) {
        
        replyMessage = replyStackSuccess;
        for (let i = 0; i < idArray.length; i++) {
          replyMessage = replyMessage.concat(` `, `<@${idArray[i]}>`);
        }
        message.reply(replyMessage);

        const formedTime = Math.floor(Date.now() / 1000);

        message.edit({
          content: `*The stack of ${stackSize} requested by ${interaction.user.username} formed <t:${formedTime}:R>.*`,
          components: [],
        });
      } else {

        replyMessage = `*The stack didn't form in time for ${interaction.user.username}.  However, the following people might still be interested in playing:*`;
        for (let i = 0; i < idArray.length; i++) {
          replyMessage = replyMessage.concat(`\n - `, `<@${usernameArray[i]}>`);
        }

        message.reply(replyStackTimeout);
        message.edit({
          content: replyMessage,
          components: [],
        });
      }
    });

    /*
    message.react("👍");
    const filter = (reaction, user) => {
      return ["👍"].includes(reaction.emoji.name);
    };
    const collector = message.createReactionCollector({
      filter,
      time: timeOutInMS,
      dispose: true,
    });
    let idArray = [];
    collector.on("collect", (reaction, user) => {
      if (user != interaction.user && !idArray.includes(user.id)) {
        idArray.push(user.id);
      }
      if (idArray.length == stackSize) {
        collector.stop();
      }
    });

    collector.on("remove", (reaction, user) => {
      if (user != interaction.user) {
        index = idArray.indexOf(user.id);
        idArray.splice(index, 1);
      }
    });

    collector.on("end", (collected) => {
      idArray.shift();
      idArray.push(interaction.user.id);
      if (idArray.length == stackSize) {
        let replyMessage = `It's time to play!`;
        for (let i = 0; i < idArray.length; i++) {
          replyMessage = replyMessage.concat(` `, `<@${idArray[i]}>`);
        }
        message.reply(replyMessage);

        const formedTime = Math.floor(Date.now()/1000)

        message.edit(`*The stack of ${stackSize} requested by ${interaction.user.username} formed <t:${formedTime}:R>.*`);
      } else {
        message.reply("Not enough for a stack right now. Try again later!");
         message.edit(`*The stack didn't form in time for ${interaction.user.username}.*`);
      }
    });
    */
  },
};
