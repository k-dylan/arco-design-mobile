const { execSync } = require('child_process');
const fs = require('fs');

if (!fs.existsSync('.git')) {
    console.log('.git directory is not exist');
    process.exit(1);
}

if (
    !~execSync('npm config get registry')
        .toString()
        .search('https://packages.aliyun.com/5ffd87467c4a6a0f9774e601/npm/npm-registry/')
) {
    console.log('please check npm registry');
    process.exit(1);
}
