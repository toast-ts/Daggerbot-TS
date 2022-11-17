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
    interaction?: any
}
export interface Punishment {
    id: number;
    type: string;
    member: string;
    moderator: string;
    expired?: boolean;
    time?: number;
    reason?: string;
    endTime?: number;
    cancels?: number;
    duration?: number;
}