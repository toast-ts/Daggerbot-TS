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

  protected channelFetch = async(client:TClient, channel:ChannelList)=>await client.channels.fetch(config.dcServer.channels[channel]) as Discord.TextChannel;
  protected async fetch(client:TClient, channel:ChannelList, webhookId:Discord.Snowflake) {
    const hookInstance = await (await this.channelFetch(client, channel)).fetchWebhooks().then(x=>x.find(y=>y.id===webhookId));
    if (!hookInstance) throw new Error('[HookManager] Webhook not found.');
    return hookInstance;
  }
  async send(message:string|Discord.MessagePayload|Discord.WebhookMessageCreateOptions) {
    const hook = await this.fetch(this.client, this.channel, this.webhookId);
    return hook.send(message).catch(err=>(this.client.channels.resolve(config.dcServer.channels.errors) as Discord.TextChannel).send(`Failed to send a webhook message in #${this.channel}:\n\`\`\`\n${err.message}\n\`\`\``));
  }
  async edit(messageId:Discord.Snowflake, message:string|Discord.MessagePayload|Discord.WebhookMessageEditOptions) {
    const hook = await this.fetch(this.client, this.channel, this.webhookId);
    return hook.editMessage(messageId, message).catch(err=>(this.client.channels.resolve(config.dcServer.channels.errors) as Discord.TextChannel).send(`Failed to edit a webhook message in #${this.channel}:\n\`\`\`\n${err.message}\n\`\`\``));
  }
}
