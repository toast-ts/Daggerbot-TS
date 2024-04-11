export default ()=>{
  const ranIntoSomething = [
    'tree', 'rock',
    'wall', 'fence',
    'sign', 'car',
    'bike', 'pedestrian',
    'dog', 'cat',
    'cow', 'sheep',
    'bench', 'table',
    'chair', 'house',
    'building', 'skyscraper',
    'statue', 'lamp post',
    'traffic light', 'bridge',
    'fountain', 'dumpster',
    'mailbox', 'parking meter',
    'bus', 'truck', 'glass door'
  ] as string[];
  return ranIntoSomething[Math.floor(Math.random()*ranIntoSomething.length)];
}
