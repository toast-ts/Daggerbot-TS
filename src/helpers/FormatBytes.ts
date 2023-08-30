export default (bytes:number, decimals:number = 2)=>{
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(decimals < 0 ? 0 : decimals))+ ' ' +['Bytes', 'KB', 'MB', 'GB', 'TB'][i]
}