export default class Formatters {
  public static timeFormat(int:number, accuracy:number = 1, opts?:{longNames?:boolean, commas?:boolean}) {
    let achievedAccuracy:number = 0;
    let txt:string = '';
    for (const timeName of [
      {name: 'year',   length: 31536000000},
      {name: 'month',  length: 2592000000},
      {name: 'week',   length: 604800000},
      {name: 'day',    length: 86400000},
      {name: 'hour',   length: 3600000},
      {name: 'minute', length: 60000},
      {name: 'second', length: 1000}
    ]) {
      if (achievedAccuracy < accuracy) {
        const fullTimeLen = Math.floor(int/timeName.length);
        if (fullTimeLen === 0) continue;
        achievedAccuracy++;
        txt += fullTimeLen + (opts?.longNames ? (' '+timeName.name+(fullTimeLen === 1 ? '' : 's')) : timeName.name.slice(0, timeName.name === 'month' ? 2 : 1)) + (opts?.commas ? ', ' : ' ');
        int -= fullTimeLen*timeName.length;
      } else break;
    }
    if (txt.length === 0) txt = int + (opts?.longNames ? ' milliseconds' : 'ms') + (opts?.commas ? ', ' : '');
    if (opts?.commas) {
      txt = txt.slice(0, -2);
      if (opts?.longNames) {
        const txtArr = txt.split('');
        txtArr[txt.lastIndexOf(',')] = ' and';
        txt = txtArr.join('');
      }
    } return txt.trim();
  }
  public static DayOfTheYear(num:number) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const suffix = num % 100;
    return num +(suffixes[(suffix-20)%10]||suffixes[suffix]||suffixes[0])
  }
  public static byteFormat(bytes:number) {
  if (bytes === null ?? bytes === undefined ?? bytes <= 0) return '0 Bytes';
    let scaleCount = 0;
    let dataInitials = ['Bytes', 'KB', 'MB', 'GB'];
    while (bytes >= 1024 && scaleCount < dataInitials.length -1) {
      bytes /= 1024;
      scaleCount++;
    }
    if (scaleCount >= dataInitials.length) scaleCount = dataInitials.length -1;
    let compactedBytes = bytes.toFixed(2).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    compactedBytes += ' '+dataInitials[scaleCount];
    return compactedBytes.trim();
  }
}
