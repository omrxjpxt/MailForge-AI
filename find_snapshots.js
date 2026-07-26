const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('onSnapshot')) {
    console.log(file);
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('onSnapshot')) {
        console.log(`  Line ${i+1}: ${line.trim()}`);
      }
    });
  }
});
