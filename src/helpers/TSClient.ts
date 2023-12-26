import TokenService from '@toast/tokenservice-client';

export default async()=>new TokenService('daggerbot').connect();
