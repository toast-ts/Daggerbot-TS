interface formatTimeOpt {
  longNames: boolean,
  commas: boolean
}

export default (integer:number, accuracy:number = 1, options?:formatTimeOpt)=>{
  let achievedAccuracy = 0;
  let text:any = '';
  for (const timeName of [
    {name: 'year',   length: 31536000000},
    {name: 'month',  length: 2592000000},
    {name: 'week',   length: 604800000},
    {name: 'day',    length: 86400000},
    {name: 'hour',   length: 3600000},
    {name: 'minute', length: 60000},
    {name: 'second', length: 1000}
  ]){
    if (achievedAccuracy < accuracy){
      const fullTimelengths = Math.floor(integer/timeName.length);
      if (fullTimelengths === 0) continue;
      achievedAccuracy++;
      text += fullTimelengths + (options?.longNames ? (' '+timeName.name+(fullTimelengths === 1 ? '' : 's')) : timeName.name.slice(0, timeName.name === 'month' ? 2 : 1)) + (options?.commas ? ', ' : ' ');
      integer -= fullTimelengths*timeName.length;
    } else break;
  }
  if (text.length === 0) text = integer + (options?.longNames ? ' milliseconds' : 'ms') + (options?.commas ? ', ' : '');
  if (options?.commas){
    text = text.slice(0, -2);
    if (options?.longNames){
      text = text.split('');
      text[text.lastIndexOf(',')] = ' and';
      text = text.join('');
    }
  } return text.trim();
}
