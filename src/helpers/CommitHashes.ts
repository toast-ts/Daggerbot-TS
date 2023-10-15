import {parentPort} from 'node:worker_threads';
import {execSync} from 'node:child_process';

async function commitHashes() {
  const localHash = execSync('git rev-parse HEAD').toString().trim().slice(0, 7);
  const remoteHash = execSync('git ls-remote origin HEAD').toString().split('\t')[0].slice(0, 7);
  return { localHash, remoteHash };
}

commitHashes().then(data=>parentPort.postMessage(data))
