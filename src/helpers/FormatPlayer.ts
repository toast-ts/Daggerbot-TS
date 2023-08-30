import {FSPlayer} from '../typings/interfaces';

export default class FormatPlayer {
  static uptimeFormat(playTime: number){
    var Hours = 0;
    playTime = Math.floor(Number(playTime));
    if(playTime >= 60){
      var Hours = Math.floor(Number(playTime)/60);
      var Minutes = (Number(playTime)-(Hours*60));
    } else Minutes = Number(playTime)
    if(Hours >= 24){
      var Days = Math.floor(Number(Hours)/24);
      var Hours = (Hours-(Days*24));
    } return (Days > 0 ? Days+' d ':'')+(Hours > 0 ? Hours+' h ':'')+(Minutes > 0 ? Minutes+' m':'')
  }
  static decoratePlayerIcons(player:FSPlayer){
    let decorator = player.isAdmin ? ':detective:' : '';
    decorator += player.name.includes('Toast') ? '<:toast:1132681026662056079>' : '';
    decorator += player.name.includes('Daggerwin') ? '<:Daggerwin:549283056079339520>' : ''; // Probably useless lol, but we'll see.
    return decorator
  }
}
