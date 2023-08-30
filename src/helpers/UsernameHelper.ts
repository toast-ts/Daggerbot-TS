export default class UsernameHelper {
  static stripName(text: string){
    let matchesLeft = true;
    const dirSlash = process.platform === 'linux' ? '\/' : '\\';
    const array = text.split(dirSlash);
    while (matchesLeft) {
      let usersIndex = array.indexOf(process.platform === 'linux' ? 'media' : 'Users');
      if (usersIndex < 1) matchesLeft = false;
      else {
        let usernameIndex = usersIndex + 1;
        if (array[usernameIndex].length === 0) usernameIndex += 1;
        array[usernameIndex] = '･'.repeat(array[usernameIndex].length);
        array[usersIndex] = process.platform === 'linux' ? 'med\u200bia' : 'Us\u200bers';
      }
      return array.join(dirSlash);
    }
  }
}
