import {Octokit} from '@octokit/rest';
import {createTokenAuth} from '@octokit/auth-token';
import TSClient from './TSClient.js';
import git from 'simple-git';
const summonAuth = createTokenAuth((await TSClient()).octokit);
const octokit = new Octokit({auth: await summonAuth().token, timeZone: 'Australia/NSW', userAgent: 'Daggerbot-TS'});
export default class GitHub {
  private static repositoryConfig = {owner: 'toast-ts', repo: 'Daggerbot-TS', ref: 'HEAD'};
  public static async RemoteRepository() {
    const {data} = await octokit.repos.getCommit(this.repositoryConfig);
    return data;
  }
  public static async LocalRepository() {
    const {latest} = await git().log({maxCount: 1});
    return latest;
  }
}
