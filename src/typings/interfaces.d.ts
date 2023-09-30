import Discord from 'discord.js';

export interface Punishment {
  _id: number;
  type: string;
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
    players: Array<FSPlayer>
  },
  vehicles: Array<FSVehicle>
}
interface FSVehicle {
  name: string,
  category: string,
  type: string,
  x: number,
  y: number,
  z: number,
  fills: Array<FSVehicleFill>,
  controller: string
}
interface FSVehicleFill {
  type: string,
  level: number
}
export interface FSPlayer {
  isUsed: boolean,
  isAdmin: boolean,
  uptime: number,
  name: string
}
export interface FSCareerSavegame {
  settings: {
    savegameName: XMLText,
    creationDate: XMLText,
    mapId: XMLText,
    mapTitle: XMLText,
    saveDataFormatted: XMLText,
    saveDate: XMLText,
    resetVehicles: XMLText,
    trafficeEnabled: XMLText,
    stopAndGoBraking: XMLText,
    trailerFillLimit: XMLText,
    automaticMotorStartEnabled: XMLText,
    growthMode: XMLText,
    fixedSeasonalVisuals: XMLText,
    plannedDaysPerPeriod: XMLText,
    fruitDestruction: XMLText,
    plowingRequiredEnabled: XMLText,
    stonesEnabled: XMLText,
    weedsEnabled: XMLText,
    limeRequired: XMLText,
    isSnowEnabled: XMLText,
    fuelUsage: XMLText,
    helperBuyFuel: XMLText,
    helperBuySeeds: XMLText,
    helperSlurrySource: XMLText,
    helperManureSource: XMLText,
    densityMapRevision: XMLText,
    terrainTextureRevision: XMLText,
    terrainLodTextureRevision: XMLText,
    splitShapesRevision: XMLText,
    tipCollisionRevision: XMLText,
    placementCollisionRevision: XMLText,
    navigationCollisionRevision: XMLText,
    mapDensityMapRevision: XMLText,
    mapTerrainTextureRevision: XMLText,
    mapTerrainLodTextureRevision: XMLText,
    mapSplitShapesRevision: XMLText,
    mapTipCollisionRevision: XMLText,
    mapPlacementCollisionRevision: XMLText,
    mapNavigationCollisionRevision: XMLText,
    difficulty: XMLText,
    economicDifficulty: XMLText,
    dirtInterval: XMLText,
    timeScale: XMLText,
    autoSaveInterval: XMLText
  },
  statistics: {
    money: XMLText,
    playTime: XMLText
  },
  slotSystem: {
    _attributes: {
      slotUsage: string
    }
  }
}
interface XMLText {
  _text: string
}
export interface Tokens {
  main: string
  beta: string
  toast: string
  spotify: {
    client: string,
    secret: string
  }
  octokit: string
  mongodb_uri: string
  mongodb_uri_dev: string
}
export interface Config {
  embedColor: Discord.ColorResolvable,
  embedColorGreen: Discord.ColorResolvable,
  embedColorOrange: Discord.ColorResolvable,
  embedColorYellow: Discord.ColorResolvable,
  embedColorRed: Discord.ColorResolvable,
  embedColorBCA: Discord.ColorResolvable,
  embedColorXmas: Discord.ColorResolvable,
  LRSstart: number,
  whitelistedServers: Array<string>,
  MPStatsLocation: {
    mainServer: {
      channel: string
      message: string
    },
    secondServer: {
      channel: string
      message: string
    }
  },
  botSwitches: {
    dailyMsgsBackup: boolean,
    registerCommands: boolean,
    commands: boolean,
    logs: boolean,
    music: boolean,
    buttonRoles: boolean,
    automod: boolean,
    mpstats: boolean,
    autores: boolean
  },
  botPresence: Discord.PresenceData,
  eval: boolean,
  whitelist: Array<string>,
  contribList: Array<string>,
  mainServer: {
    id: string,
    staffRoles: Array<string>,
    roles: {
      admin: string,
      bottech: string,
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
      console: string,
      errors: string,
      thismeanswar: string,
      bot_suggestions: string,
      bot_status: string,
      logs: string,
      welcome: string,
      botcommands: string,
      bankick_log: string,
      fs_server_log: string,
      punishment_log: string,
      dcmod_chat: string
    }
  }
}
