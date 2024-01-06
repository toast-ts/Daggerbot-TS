export default (text:string)=>{
  const dirSlash = process.platform === 'linux' ? '\/' : '\\';
  return text?.replace(/(?<=\/Users\/|\/home\/|\/media\/)[^/]+/g, match=>'･'.repeat(match.length)).split(dirSlash).join(dirSlash);
}
