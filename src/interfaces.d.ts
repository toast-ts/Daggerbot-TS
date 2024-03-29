import {ColorResolvable, PresenceData, APIUser} from 'discord.js';

export interface Punishment {
  case_id: number;
  type: string;
  member_name: string;
  member: string;
  moderator: string;
  expired?: boolean;
  time: number;
  reason: string;
  endTime?: number;
  cancels?: number;
  duration?: number;
}
export interface FSData {
  server: {
    dayTime: number,
    game: string,
    mapName: string,
    mapSize: number,
    mapOverviewFilename: string,
    money: number,
    name: string,
    server: string,
    version: string
  },
  slots: {
    capacity: number,
    used: number,
    players: FSPlayer[]
  },
  vehicles: FSVehicle[]
}
interface FSVehicle {
  name: string,
  category: string,
  type: string,
  x: number,
  y: number,
  z: number,
  fills: FSVehicleFill[],
  controller: string
}
interface FSVehicleFill {
  type: string,
  level: number
}
export interface FSPlayer {
  isUsed?: boolean,
  isAdmin: boolean,
  uptime: number,
  name: string
}
export interface FSCareerSavegame {
  settings: {
    savegameName: string,
    creationDate: string,
    mapId: string,
    mapTitle: string,
    saveDataFormatted: string,
    saveDate: string,
    resetVehicles: string,
    trafficeEnabled: string,
    stopAndGoBraking: string,
    trailerFillLimit: string,
    automaticMotorStartEnabled: string,
    growthMode: string,
    fixedSeasonalVisuals: string,
    plannedDaysPerPeriod: string,
    fruitDestruction: string,
    plowingRequiredEnabled: string,
    stonesEnabled: string,
    weedsEnabled: string,
    limeRequired: string,
    isSnowEnabled: string,
    fuelUsage: string,
    helperBuyFuel: string,
    helperBuySeeds: string,
    helperSlurrySource: string,
    helperManureSource: string,
    densityMapRevision: string,
    terrainTextureRevision: string,
    terrainLodTextureRevision: string,
    splitShapesRevision: string,
    tipCollisionRevision: string,
    placementCollisionRevision: string,
    navigationCollisionRevision: string,
    mapDensityMapRevision: string,
    mapTerrainTextureRevision: string,
    mapTerrainLodTextureRevision: string,
    mapSplitShapesRevision: string,
    mapTipCollisionRevision: string,
    mapPlacementCollisionRevision: string,
    mapNavigationCollisionRevision: string,
    difficulty: string,
    economicDifficulty: string,
    dirtInterval: string,
    timeScale: string,
    autoSaveInterval: string
  },
  statistics: {
    money: string,
    playTime: string
  },
  slotSystem: {
    slotUsage: string
  }
}
export interface Config {
  configName: string,
  embedColor: ColorResolvable,
  embedColorGreen: ColorResolvable,
  embedColorYellow: ColorResolvable,
  embedColorRed: ColorResolvable,
  embedColorInvis: ColorResolvable,
  embedColorBCA: ColorResolvable,
  embedColorXmas: ColorResolvable,
  LRSstart: number,
  whitelistedServers: string[],
  botSwitches: {
    dailyMsgsBackup: boolean,
    registerCommands: boolean,
    commands: boolean,
    logs: boolean,
    mpSys: boolean,
    buttonRoles: boolean,
    automod: boolean,
    autores: boolean
  },
  botPresence: PresenceData,
  whitelist: string[],
  contribList: string[],
  dcServer: {
    id: string,
    staffRoles: string[],
    roles: {
      admin: string,
      dcmod: string,
      mpmanager: string,
      mpmod: string,
      vtcmanager: string,
      vtcstaff: string,
      ytmod: string,
      mphelper: string,
      mpplayer: string,
      vtcmember: string
    },
    channels: {
      errors: string,
      thismeanswar: string,
      bot_suggestions: string,
      bot_status: string,
      bot_log: string,
      welcome: string,
      botcommands: string,
      bankick_log: string,
      punishment_log: string,
      dcmod_chat: string,
      mpmod_chat: string,
      multifarm_chat: string,
      pw_list: string,
      help_forum: string,
      server_log: string
    }
  }
}
// Credits to VanillaSixtySix/neurobot for inspiration.
// https://github.com/VanillaSixtySix/neurobot/blob/0dee4ea4f72872e2df240700eb56e1d38da1f8bb/src/interactions/jp.ts#L37-L85
export interface RawGatewayPacket<T> {
  t: 'MESSAGE_DELETE'|'MESSAGE_UPDATE';
  d: T;
}
export interface RawMessageDelete {
  id: string,
  channel_id: string,
  guild_id: string
}
export interface RawMessageUpdate {
  id: string,
  channel_id: string,
  guild_id: string,
  content: string,
  embeds: any[],
  components: any[],
  attachments: any[],
  author: APIUser
  member: { roles: any[] }
}
