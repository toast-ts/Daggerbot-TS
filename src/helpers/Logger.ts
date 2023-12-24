import dayjs from 'dayjs';

export default class Logger {
  public static console =(logType:'log'|'error', prefix:string, message:any)=>console[logType](`[${dayjs().format('DD/MM/YY HH:mm:ss')}]`, `[${prefix}]`, message);
}
