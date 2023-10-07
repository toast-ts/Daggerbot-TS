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
      dcmod_chat: string,
      mf_chat: string
    }
  }
}
