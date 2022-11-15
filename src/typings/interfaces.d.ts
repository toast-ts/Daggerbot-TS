interface createTableOpt {
    columnAlign: any,
    columnSeparator: any,
    columnEmptyChar: any
}
interface formatTimeOpt {
    longNames: boolean,
    commas: boolean
}
interface CommandInfoOpt {
    insertNewline: boolean,
    parts: string[], //idfk
    titles: string[]
}
interface punOpt {
    time?: string,
    reason?: string,
    interaction?: any
}
interface Punishment {
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