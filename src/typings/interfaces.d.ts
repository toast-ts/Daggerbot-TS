import Discord from 'discord.js';

export interface UserLevels {
    messages: number,
    level: number
}
export interface formatTimeOpt {
    longNames: boolean,
    commas: boolean
}
export interface createTableOpt {
    columnAlign: any,
    columnSeparator: any,
    columnEmptyChar: any
}
export interface punOpt {
    time?: string,
    reason?: string,
    interaction?: Discord.ChatInputCommandInteraction<"cached">
}
export interface Punishment {
    id: number;
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