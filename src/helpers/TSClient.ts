interface TokenService_API {
  main:      string,
  beta:      string,
  mongodb_uri: string,
  redis_uri: string,
  octokit:   string,
  spotify: {
    client:  string,
    secret:  string
  }
}

export default class TSClient {
  static async Token() {
    return await fetch('http://localhost:36961/daggerbot').then(x=>x.json()) as Promise<TokenService_API>
  }
}
