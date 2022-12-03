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