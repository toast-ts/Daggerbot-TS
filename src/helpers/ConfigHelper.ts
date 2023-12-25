import {readFileSync} from 'node:fs';
import {Config} from 'src/interfaces';
export default class ConfigHelper {
  static loadConfig() {
    let importconfig:Config;
    try {
      importconfig = JSON.parse(readFileSync(process.argv[2] ?? 'src/config.json', 'utf8'));
      console.log(`Loaded the config :: ${importconfig.configName}`);
    } catch (e) {
      console.error(`Error loading config file "${process.argv[2] ?? 'src/config.json'}": ${e}`);
      process.exit(1);
    }
    return importconfig;
  }
  static readConfig =()=>JSON.parse(readFileSync(process.argv[2] ?? 'src/config.json', 'utf8')) as Config;
  static isDevMode =()=>this.readConfig().configName.includes('Beta');
}
