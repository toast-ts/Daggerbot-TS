import Discord from 'discord.js';
import TClient from '../client.js';
import ConfigHelper from '../helpers/ConfigHelper.js';
const config = ConfigHelper.readConfig();
type ChannelList = keyof typeof config.dcServer.channels;
export default class HookMgr {
  private client:TClient;
  private channel:ChannelList;
  private webhookId:Discord.Snowflake;

  constructor(client:TClient, channel:ChannelList, webhookId:Discord.Snowflake) {
    this.client = client;
    this.channel = channel;
    this.webhookId = webhookId;
  }

  protected channelFetch = (channel:ChannelList)=>this.client.channels.cache.get(config.dcServer.channels[channel]) as Discord.TextChannel;
  protected async fetch(channel:ChannelList, webhookId:Discord.Snowflake) {
    const hookInstance = await this.channelFetch(channel).fetchWebhooks().then(x=>x.get(webhookId));
    if (!hookInstance) throw new Error('[HookManager] Webhook not found.');
    return hookInstance;
  }
  async send(message:string|Discord.MessagePayload|Discord.WebhookMessageCreateOptions) {
    const hook = await this.fetch(this.channel, this.webhookId);
    return hook.send(message).catch(err=>(this.client.channels.cache.get(config.dcServer.channels.errors) as Discord.TextChannel).send(`[HookManager] Failed to send a webhook message in #${this.channel}:\n\`\`\`\n${err.message}\n\`\`\``));
  }
  async edit(messageId:Discord.Snowflake, message:string|Discord.MessagePayload|Discord.WebhookMessageEditOptions) {
    const hook = await this.fetch(this.channel, this.webhookId);
    return hook.editMessage(messageId, message).catch(err=>(this.client.channels.cache.get(config.dcServer.channels.errors) as Discord.TextChannel).send(`[HookManager] Failed to edit a webhook message in #${this.channel}:\n\`\`\`\n${err.message}\n\`\`\``));
  }
}
