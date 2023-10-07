import dayjs from 'dayjs';

export default class Logger {
  static logTime() {
    return `[${dayjs().format('DD/MM/YY HH:mm:ss')}]`;
  }
  static logPrefix(prefix:string) {
    return `[${prefix}]`;
  }
  static forwardToConsole(logType:'log'|'error', prefix:string, message:string|any) {
    console[logType](this.logTime(), this.logPrefix(prefix), message);
  }
}
