const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app/studio', function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Remove imports
    if (content.includes("import BackgroundImage")) {
      content = content.replace(/import BackgroundImage from '@\/components\/ui\/BackgroundImage';\n/g, '');
      changed = true;
    }
    if (content.includes("import GoldWaveSVG")) {
      content = content.replace(/import GoldWaveSVG from '@\/components\/ui\/GoldWaveSVG';\n/g, '');
      changed = true;
    }

    // Remove components
    if (content.includes("<BackgroundImage")) {
      content = content.replace(/<BackgroundImage[^>]*\/>\n/g, '');
      changed = true;
    }
    if (content.includes("<GoldWaveSVG")) {
      content = content.replace(/<GoldWaveSVG[^>]*\/>\n/g, '');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
