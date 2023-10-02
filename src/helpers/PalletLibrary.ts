import {FSData} from 'src/typings/interfaces';

export default (serverEndpoint:FSData)=>{
  const getAmount =(type:string)=>serverEndpoint.vehicles.filter(v=>v.type === 'pallet').map(v=>v.fills).flat().map(t=>t.type).filter(t=>t===type).length;
  let palletTypeName = serverEndpoint.vehicles.filter(v=>v.type === 'pallet').map(v=>v.fills).flat().map(t=>t.type).filter((t,i,a)=>a.indexOf(t)===i).map(t=>({
    [t]:{
      name: t.toLowerCase().slice(0,1).toUpperCase()+t.toLowerCase().slice(1),
      size: getAmount(t.toUpperCase())
    },
  })).reduce((a,b)=>({...a,...b}));
  return palletTypeName;
}
