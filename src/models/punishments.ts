import Discord from 'discord.js';
import TClient from '../client.js';
import mongoose from 'mongoose';
import ms from 'ms';
import {Punishment} from '../typings/interfaces.js';

const Schema = mongoose.model('punishments', new mongoose.Schema({
  _id: {type: Number, required: true},
  type: {type: String, required: true},
  member: {type: String, required: true},
  moderator: {type: String, required: true},
  expired: {type: Boolean},
  time: {type: Number, required: true},
  reason: {type: String, required: true},
  endTime: {type: Number},
  cancels: {type: Number},
  duration: {type: Number}
}, {versionKey: false}));

export default class punishments extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
  createId = async()=>Math.max(...(await this._content.find({})).map(x=>x.id), 0) + 1;
  async makeModlogEntry(punishment:Punishment){
    // Format data into an embed
    const channel = ['kick', 'ban'].includes(punishment.type) ? this.client.config.mainServer.channels.bankick_log : this.client.config.mainServer.channels.logs;
    const embed = new this.client.embed().setTitle(`${punishment.type[0].toUpperCase() + punishment.type.slice(1)} | Case #${punishment._id}`)
      .addFields(
        {name: '🔹 User', value: `<@${punishment.member}>\n\`${punishment.member}\``, inline: true},
        {name: '🔹 Moderator', value: `<@${punishment.moderator}>\n\`${punishment.moderator}\``, inline: true},
        {name: '\u200b', value: '\u200b', inline: true},
        {name: '🔹 Reason', value: `\`${punishment.reason}\``, inline: true})
      .setColor(this.client.config.embedColor).setTimestamp(punishment.time)
    if (punishment.duration) embed.addFields({name: '🔹 Duration', value: this.client.formatTime(punishment.duration, 100), inline: true}, {name: '\u200b', value: '\u200b', inline: true})
    if (punishment.cancels) {
      const cancels = await this._content.findById(punishment.cancels);
      embed.addFields({name: '🔹 Overwrites', value: `This case overwrites Case #${cancels.id}\n\`${cancels.reason}\``})
    }
    // Send it off to specific Discord channel.
    (this.client.channels.cache.get(channel) as Discord.TextChannel).send({embeds:[embed]});
  }
  getTense(type:string){// Get past tense form of punishment type, grammar yes
    return {
      ban: 'banned',
      softban: 'softbanned',
      kick: 'kicked',
      mute: 'muted',
      warn: 'warned'
    }[type]
  }
  async addPunishment(type:string, options:{time?:string,interaction?:Discord.ChatInputCommandInteraction<'cached'>},moderator:string,reason:string,User:Discord.User,GuildMember?:Discord.GuildMember){
    const {time,interaction} = options;
    const now = Date.now();
    const guild = this.client.guilds.cache.get(this.client.config.mainServer.id) as Discord.Guild;
    const punData:Punishment={type, _id: await this.createId(), member:User.id, reason, moderator, time:now}
    const inOrFromBoolean = ['warn', 'mute'].includes(type) ? 'in' : 'from';
    const auditLogReason = `${reason || 'Reason unspecified'} | Case #${punData._id}`;
    const embed = new this.client.embed()
      .setColor(this.client.config.embedColor)
      .setTitle(`Case #${punData._id}: ${type[0].toUpperCase()+type.slice(1)}`)
      .setDescription(`${User.tag}\n<@${User.id}>\n(\`${User.id}\`)`)
      .addFields({name: 'Reason', value: reason})
    let punResult;
    let timeInMillis;
    let DM;

    if (type == 'mute') timeInMillis = time ? ms(time) : 2419140000; // Timeouts have a limit of 4 weeks
    else timeInMillis = time ? ms(time) : null;

    const durationText = timeInMillis ? ` for ${this.client.formatTime(timeInMillis, 4, {longNames:true,commas:true})}` : '';
    if (time) embed.addFields({name: 'Duration', value: durationText});
    
    if (GuildMember){
      try{
        DM=await GuildMember.send(`You've been ${this.getTense(type)} ${inOrFromBoolean} ${guild.name}${durationText} for \`${reason}\` (Case #${punData._id})`);
      }catch(err){
        embed.setFooter({text: 'Failed to DM a member.'})
      }
    }

    if (['ban', 'softban'].includes(type)){
      const banned = await guild.bans.fetch(User.id).catch(()=>undefined);
      if (!banned) punResult = await guild.bans.create(User.id, {reason: auditLogReason, deleteMessageSeconds: 172800}).catch((err:Error)=>err.message)
      else punResult = 'User is already banned.';
    }
    else if (type == 'kick') punResult = await GuildMember?.kick(auditLogReason).catch((err:Error)=>err.message);
    else if (type == 'mute') punResult = await GuildMember?.timeout(timeInMillis, auditLogReason).catch((err:Error)=>err.message);
    if (type == 'softban' && typeof punResult != 'string') punResult = await guild.bans.remove(User.id, auditLogReason).catch((err:Error)=>err.message);

    if (timeInMillis && ['mute','ban'].includes(type)){
      punData.endTime = now + timeInMillis;
      punData.duration = timeInMillis;
    }

    if (typeof punResult == 'string'){// Unsuccessful punishment
      if (DM) DM.delete();
      if (interaction) return interaction.editReply(punResult);
      else return punResult;      
    } else {
      await this.makeModlogEntry(punData);
      await this._content.create(punData);

      if (interaction) return interaction.editReply({embeds:[embed]});
      else return punResult;
    }
  }
  async removePunishment(caseId:number,moderator:string,reason:string,interaction?:Discord.ChatInputCommandInteraction<'cached'>){
    const now = Date.now();
    const _id = await this.createId();
    const punishment = await this._content.findById(caseId);
    if (!punishment) return 'Punishment not found.';
    const guild = this.client.guilds.cache.get(this.client.config.mainServer.id) as Discord.Guild;
    const auditLogReason = `${reason || 'Reason unspecified'} | Case #${punishment.id}`;
    const User = await this.client.users.fetch(punishment.member);
    const GuildMember = await guild.members.fetch(punishment.member).catch(()=>null);

    let removePunishmentData:Punishment={type:`un${punishment.type}`, _id, cancels:punishment.id, member:punishment.member, reason, moderator, time:now};
    let removePunishmentResult;

    if (punishment.type == 'ban') removePunishmentResult = guild.bans.remove(punishment.member, auditLogReason).catch((err:Error)=>err.message);
    else if (punishment.type == 'mute'){
      if (GuildMember){
        removePunishmentResult = GuildMember.timeout(null, auditLogReason).catch((err:Error)=>err.message);
        GuildMember.send(`You've been unmuted in ${guild.name}.`).catch((err:Error)=>console.log(err.message));
      } else await this._content.findByIdAndUpdate(caseId,{expired:true},{new:true});
    } else removePunishmentData.type = 'punishmentOverride';

    if (typeof removePunishmentResult == 'string'){//Unsuccessful punishment
      if (interaction) return interaction.reply(removePunishmentResult);
      else return removePunishmentResult;
    } else {
      await this._content.findByIdAndUpdate(caseId,{expired:true},{new:true});
      await this._content.create(removePunishmentData);
      await this.makeModlogEntry(removePunishmentData);

      if (interaction) return interaction.reply({embeds:[new this.client.embed().setColor(this.client.config.embedColor)
        .setTitle(`Case #${removePunishmentData._id}: ${removePunishmentData.type[0].toUpperCase()+removePunishmentData.type.slice(1)}`)
        .setDescription(`${User.tag}\n<@${User.id}>\n(\`${User.id}\`)`)
        .addFields({name: 'Reason', value: reason},{name: 'Overwrites', value: `Case #${punishment.id}`})
      ]});
      else return `Successfully un${this.getTense(removePunishmentData.type.replace('un', ''))} ${User.tag} (\`${User.id}\`) for ${reason}`
    }
  }
}
