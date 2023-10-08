export default class UsernameHelper {
  static stripName(text: string){
    const dirSlash = process.platform === 'linux' ? '\/' : '\\';
    return text.replace(/(?<=\/Users\/|\/media\/)[^/]+/g, match=>'･'.repeat(match.length)).split(dirSlash).join(dirSlash);
  }
}
