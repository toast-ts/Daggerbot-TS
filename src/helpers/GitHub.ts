interface IDataContent {
  sha: string;
  content: string;
}
import {Octokit} from '@octokit/rest';
import TSClient from './TSClient.js';
import git from 'simple-git';

const octokit = new Octokit({auth: (await TSClient()).octokit, timeZone: 'Australia/NSW', userAgent: 'Daggerbot-TS'});
export default class GitHub {
  private static repositoryConfig = {owner: 'toast-ts', ref: 'temp'};
  public static async RemoteRepository() {
    const {data} = await octokit.repos.getCommit({repo: 'Daggerbot-TS', ...this.repositoryConfig});
    return data;
  }
  public static async LocalRepository() {
    const {latest} = await git().log({maxCount: 1});
    return latest;
  }
  public static async PrivateRepository() {
    const {data} = await octokit.repos.getContent({path: 'private/_.ts', repo: 'Daggerbot-Private', ...this.repositoryConfig});
    return data as IDataContent;
  }
}
