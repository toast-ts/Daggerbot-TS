import moment from 'moment';

export default class Logger {
  static logTime() {
    return `[${moment().format('DD/MM/YY HH:mm:ss')}]`;
  }
  static logPrefix(prefix:string) {
    return `[${prefix}]`;
  }
  static forwardToConsole(logType:'log'|'error', prefix:string, message:string|any) {
    console[logType](this.logTime(), this.logPrefix(prefix), message);
  }
}
