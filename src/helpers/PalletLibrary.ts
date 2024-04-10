import {FSData} from 'src/interfaces';

export default function(data:FSData) {
  const pallets = data.vehicles.filter(x=>['PALLETS', 'BIGBAGPALLETS'].includes(x.category));
  const counts = pallets.reduce((acc, name)=>{
    acc[name.name] = (acc[name.name] ?? 0) + 1;
    return acc;
  }, {} as {[key:string]:number});
  return counts;
}
