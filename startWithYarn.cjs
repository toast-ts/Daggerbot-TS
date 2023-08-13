require('node:child_process').spawn('yarn && yarn node dist/index.js', {stdio: [null,process.stdout,process.stderr,null], windowsHide: true, shell: true})
