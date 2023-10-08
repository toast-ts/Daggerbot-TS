import Discord from 'discord.js';
import TClient from '../client.js';
import ConfigHelper from '../helpers/ConfigHelper.js';
const config = ConfigHelper.readConfig();
type ChannelList = keyof typeof config.mainServer.channels;
export default class HookMgr {
  protected static async channelFetch(client:TClient, channel:ChannelList) {
    return await client.channels.fetch(config.mainServer.channels[channel]) as Discord.TextChannel;
  }
  protected static async fetch(client:TClient, channel:ChannelList, webhookId:Discord.Snowflake) {
    const hookInstance = await (await this.channelFetch(client, channel)).fetchWebhooks().then(x=>x.find(y=>y.id===webhookId));
    if (!hookInstance) throw new Error('[HookManager] Webhook not found.');
    return hookInstance;
  }
  static async send(client:TClient, channel:ChannelList, webhookId:Discord.Snowflake, message:string|Discord.MessagePayload|Discord.WebhookMessageCreateOptions) {
    const hook = await this.fetch(client, channel, webhookId);
    return hook.send(message).catch(err=>(client.channels.resolve(config.mainServer.channels.errors) as Discord.TextChannel).send(`Failed to send a webhook message in #${channel}:\n\`\`\`\n${err.message}\n\`\`\``));
  }
  static async edit(client:TClient, channel:ChannelList, webhookId:Discord.Snowflake, messageId:Discord.Snowflake, message:string|Discord.MessagePayload|Discord.WebhookMessageEditOptions) {
    const hook = await this.fetch(client, channel, webhookId);
    return hook.editMessage(messageId, message).catch(err=>(client.channels.resolve(config.mainServer.channels.errors) as Discord.TextChannel).send(`Failed to edit a webhook message in <#${channel}>:\n\`\`\`\n${err.message}\n\`\`\``));
  }
}
