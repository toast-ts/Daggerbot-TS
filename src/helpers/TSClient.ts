import TokenService from '@toast/tokenservice-client';
export default async()=>new TokenService(process.argv[3] ?? 'daggerbot', false).connect();
