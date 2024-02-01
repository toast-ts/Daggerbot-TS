import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import CacheServer from '../components/CacheServer.js';
import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from 'sequelize';
import {ChatInputCommandInteraction, Snowflake} from 'discord.js';

class tagsystem extends Model {
  declare public tagname: string;
  declare public message: string;
  declare public embedFlag: boolean;
  declare public userid: string;
}

interface Tags {
  tagname: string;
  message: string;
  embedFlag: boolean;
  userid: string;
}

export class TagSystemSvc {
  private model: typeof tagsystem;

  constructor() {
    this.model = tagsystem;
    this.model.init({
      tagname: {
        type: DataTypes.TEXT,
        unique: true,
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      embedFlag: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      userid: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      tableName: 'tags',
      createdAt: false,
      updatedAt: false,
      sequelize: DatabaseServer.seq
    });
    this.model.sync();
  }
  async createTag(userid:string, tagName:string, message:string, embedFlag:boolean) {
    CacheServer.delete('tags');
    return await this.model.create({userid: userid, tagname: tagName, message: message.replace(/\\n/g, '\n'), embedFlag: embedFlag});
  }
  async deleteTag(tagname:string) {
    CacheServer.delete('tags');
    return await this.model.destroy({where: {tagname: tagname}});
  }
  async sendTag(interaction:ChatInputCommandInteraction, tagName:string, targetId:Snowflake) {
    const getTag = await this.model.findOne({where: {tagname: tagName}});
    const targetMsg = targetId ? `*This tag is directed at ${MessageTool.formatMention(targetId, 'user')}*` : '';
    const fetchUser = await interaction.guild?.members.fetch(getTag.dataValues.userid);
    const ic = interaction.client as TClient;
    const embedFormat = [
      new ic.embed().setTitle(tagName).setColor(ic.config.embedColor)
      .setAuthor({name: interaction.user.username, iconURL: interaction.user.avatarURL({size: 2048, extension: 'webp'})})
      .setDescription(getTag.dataValues.message)
    ];
    if (getTag.dataValues.embedFlag) return await interaction.reply({content: targetMsg, embeds: embedFormat, allowedMentions: {parse: ['users']}});
    else return await interaction.reply({content: targetMsg+`\n${getTag.dataValues.message}\n╰ **${fetchUser.displayName}**`, allowedMentions: {parse: ['users']}});
  }
  async modifyTag(tagname:string, message:string) {
    CacheServer.delete('tags');
    return await this.model.update({message: message.replace(/\\n/g, '\n')}, {where: {tagname: tagname}});
  }
  async findInCache(): Promise<Tags[]> {
    const cacheKey = 'tags';
    const cachedResult = await CacheServer.get(cacheKey, true);
    let result;
    if (cachedResult) result = cachedResult;
    else {
      result = await this.model.findAll();
      CacheServer.set(cacheKey, result, true).then(()=>CacheServer.expiry(cacheKey, 240));
    }
    return result;
  }
}
