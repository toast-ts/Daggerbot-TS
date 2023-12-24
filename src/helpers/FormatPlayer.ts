import {FSPlayer} from '../interfaces';
export default class FormatPlayer {
  static convertUptime(playTime:number) {
    let Minutes:number;
    let Hours:number;
    let Days:number;

    playTime = Math.floor(playTime);
    if (playTime >= 60) {
      Hours = Math.floor(playTime/60);
      Minutes = playTime-Hours*60;
    } else Minutes = playTime

    if (Hours >= 24) {
      Days = Math.floor(Hours/24);
      Hours = Hours-Days*24;
    }
  
    return (Days > 0 ? Days+' d ':'')+(Hours > 0 ? Hours+' h ':'')+(Minutes > 0 ? Minutes+' m':'')
  }
  static decoratePlayerIcons(player:FSPlayer) {
    let decorator = player.isAdmin ? ':detective:' : '';
    decorator += player.name.includes('Toast') ? '<:toast:1132681026662056079>' : '';
    return decorator
  }
}
