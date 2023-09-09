export default (number:number)=>{
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const suffix = number % 100;
  return number + (suffixes[(suffix - 20) % 10] || suffixes[suffix] || suffixes[0]);
}
