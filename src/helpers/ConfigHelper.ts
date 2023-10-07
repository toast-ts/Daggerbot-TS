import {readFileSync} from 'node:fs';
import {Config} from '../typings/interfaces';
export default class ConfigHelper {
  static loadConfig(configFile:string) {
    let importconfig:Config;
    try {
      importconfig = JSON.parse(readFileSync(configFile, 'utf8'));
      console.log(`Using development config :: ${importconfig.configName}`);
    } catch (e) {
      console.error(`Error loading config file "${configFile}": ${e}`);
      process.exit(1);
    }
    return importconfig;
  }
}