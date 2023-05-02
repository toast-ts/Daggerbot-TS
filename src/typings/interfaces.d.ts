import Discord from 'discord.js';

export interface UserLevels {
  messages: number,
  level: number
}
export interface formatTimeOpt {
  longNames: boolean,
  commas: boolean
}
export interface punOpt {
  time?: string,
  reason?: string,
  interaction?: Discord.ChatInputCommandInteraction<"cached">
}
export interface repeatedMessages {
  [key:string]: {data: Discord.Collection<number,{type:string,channel:string}>, timeout: NodeJS.Timeout}
}
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
export interface DSS_serverName {
  data: FSData
}
export interface FSData {
  server: FSServer,
  slots: FSslots
}
export interface FSServer {
  dayTime: number,
  game: string,
  mapName: string,
  mapSize: number,
  mapOverviewFilename: string,
  money: number,
  name: string,
  server: string,
  version: string
}
export interface FSslots {
  capacity: number,
  used: number,
  players: Array<FSPlayers>
}
export interface FSPlayers {
  isUsed: boolean,
  isAdmin: boolean,
  uptime: number,
  name: string
}
export interface FSCareerSavegame {
  settings: FSCareerSavegameSettings,
  statistics: FSCareerSavegameStatistics,
  slotSystem: FSCareerSavegameSlotSystem
}
export interface FSCareerSavegameSettings {
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
}
export interface FSCareerSavegameStatistics {
  money: XMLText,
  playTime: XMLText
}
export interface FSCareerSavegameSlotSystem {
  _attributes: slotUsage
}
interface slotUsage {
  slotUsage: string
}
interface XMLText {
  _text: string
}
export interface Tokens {
  main: string
  beta: string
  toast: string
  tae: string
  octokit: string
  webhook_url: string
  webhook_url_test: string
  mongodb_uri: string
  mongodb_uri_dev: string
}
export interface Config {
  embedColor: Discord.ColorResolvable,
  embedColorGreen: Discord.ColorResolvable,
  embedColorYellow: Discord.ColorResolvable,
  embedColorRed: Discord.ColorResolvable,
  embedColorBCA: Discord.ColorResolvable,
  embedColorXmas: Discord.ColorResolvable,
  LRSstart: number,
  whitelistedServers: Array<string>,
  botSwitches: botSwitches,
  botPresence: Discord.PresenceData,
  eval: boolean,
  whitelist: Array<string>
  mainServer: mainServer
}
interface botSwitches {
  registerCommands: boolean,
  commands: boolean,
  logs: boolean,
  automod: boolean,
  mpstats: boolean,
  autores: boolean
}
interface mainServer {
  id: string,
  staffRoles: Array<string>,
  roles: mainServerRoles,
  channels: mainServerChannels
}
interface mainServerRoles {
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
}
interface mainServerChannels {
  console: string,
  errors: string,
  thismeanswar: string,
  bot_status: string,
  logs: string,
  welcome: string,
  botcommands: string,
  bankick_log: string
}