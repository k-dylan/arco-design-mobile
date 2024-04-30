const fs = require('fs');
const path = require('path');

// 递归函数来遍历文件夹
function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

// 这个函数将链接写入Markdown文件
function createSitemap(dir, reg, outputFile) {
    const sitemap = [];
    walkDir(dir, function (filePath) {
        if (filePath.match(reg)) {
            // 将文件路径转换为链接
            // const link = `https://raw.githubusercontent.com/arco-design/arco-design-mobile/main/${filePath}`;
            const link = `https://cdn.jsdelivr.net/gh/arco-design/arco-design-mobile/${filePath}`;
            // sitemap.push(`<div><a href="${link}">${filePath}</a></div>`);
            sitemap.push(link);
        }
    });
    // sitemap.unshift('<html><body><ul>');
    // sitemap.push('</ul></body></html>');

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    // 将链接写入Markdown文件
    fs.writeFileSync(outputFile, sitemap.join('\n'));
}

// 要遍历的文件夹路径
const targetDir = './packages/arcodesign/components/';

// 执行函数
createSitemap(targetDir, /.(tsx)$/, `sites/sitemap/react-source.txt`);
createSitemap(targetDir, /.(less)$/, `sites/sitemap/react-style.txt`);
createSitemap(targetDir, /demo\/\w+\.md$/, `sites/sitemap/react-demo.txt`);
