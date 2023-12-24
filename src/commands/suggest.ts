import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import HookMgr from '../components/HookManager.js';
export default class Suggest {
  static async run(client:TClient, interaction:Discord.ChatInputCommandInteraction<'cached'>) {
    const idVal = interaction.options.getInteger('id');
    ({
      create: async()=>{
        const suggestion = interaction.options.getString('suggestion', true);
        const newSugg = await client.suggestions.create(interaction.user.id, suggestion);
        this.newWebhookMessage(client, newSugg.dataValues.id, suggestion, interaction.user.username);
        return interaction.reply({content: `Your suggestion has been sent to bot developers. \`#${newSugg.dataValues.id}\``, ephemeral: true});
      },
      delete: async()=>{
        if (client.config.dcServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.dcServer.roles.bottech)) return MessageTool.youNeedRole(interaction, 'bottech');
        }
        const sugg = await this.deleteSuggestion(client, idVal);
        if (sugg) return interaction.reply(`Suggestion \`#${idVal}\` has been deleted.`);
        else return interaction.reply(`Suggestion \`#${idVal}\` does not exist.`);
      },
      update: async()=>{
        if (client.config.dcServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.dcServer.roles.bottech)) return MessageTool.youNeedRole(interaction, 'bottech');
        }
        const status = interaction.options.getString('status', true);
        await this.updateSuggestion(client, idVal, status as 'Accepted'|'Rejected');
        client.users.fetch((await client.suggestions.fetchById(idVal)).dataValues.userid).then(x=>x.send(`Your suggestion \`#${idVal}\` has been updated to \`${status}\` by **${interaction.user.username}**`)).catch(()=>interaction.channel.send(`Unable to send DM to user of suggestion \`#${idVal}\``))
        return await interaction.reply(`Suggestion \`#${idVal}\` has been updated to \`${status}\`.`);
      }
    } as any)[interaction.options.getSubcommand()]();
  }
  static async updateSuggestion(client:TClient, id:number, status: 'Accepted'|'Rejected') {
    return await client.suggestions.updateStatus(id, status);
  }
  static async deleteSuggestion(client:TClient, id:number) {
    return await client.suggestions.delete(id);
  }
  static newWebhookMessage(client:TClient, id:number, suggestion:string, username:string) {
    const hook = new HookMgr(client, 'bot_suggestions', '1079621523561779272');
    if (hook) return hook.send({embeds: [new client.embed().setColor(client.config.embedColor).setTitle(`Suggestion #${id}`).setAuthor({name: username}).setDescription(`\`\`\`${suggestion}\`\`\``)]});
    else throw new Error('[SUGGESTION-HOOK] Provided webhook cannot be fetched, not sending message.')
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Want to suggest something to the bot devs? You can do so!')
    .addSubcommand(x=>x
      .setName('create')
      .setDescription('Create a new suggestion for your idea')
      .addStringOption(x=>x
        .setName('suggestion')
        .setDescription('Your precious idea')
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('delete')
      .setDescription('Delete a suggestion (Bot Tech only)')
      .addIntegerOption(x=>x
        .setName('id')
        .setDescription('The ID of the suggestion')
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('update')
      .setDescription('Update a suggestion (Bot Tech only)')
      .addIntegerOption(x=>x
        .setName('id')
        .setDescription('The ID of the suggestion')
        .setRequired(true))
      .addStringOption(x=>x
        .setName('status')
        .setDescription('The status of the suggestion (Accepted/Rejected)')
        .setRequired(true)
        .setChoices(
          {name: 'Accept', value: 'Accepted'},
          {name: 'Reject', value: 'Rejected'}
        )))
}
