const fs = require('fs');
const content = fs.readFileSync(process.argv[2], 'utf8');

const tags = content.match(/<div|<\/div>/g) || [];
let stack = [];

tags.forEach((tag, index) => {
  if (tag === '<div') {
    stack.push(index);
  } else {
    if (stack.length === 0) {
      console.log(`Extra closing div at tag index ${index}`);
    } else {
      stack.pop();
    }
  }
});

console.log(`Stack length at end: ${stack.length}`);
if (stack.length > 0) {
  console.log('Unclosed opening divs at indices:', stack);
  // Find the lines for these indices
  let currentIdx = 0;
  stack.forEach(tagIdx => {
    let count = 0;
    let lineNum = 1;
    for (let i = 0; i < content.length; i++) {
        if (content.substring(i, i+4) === '<div') {
            if (count === tagIdx) {
                console.log(`Unclosed div at line ${lineNum}`);
                break;
            }
            count++;
        }
        if (content[i] === '\n') lineNum++;
    }
  });
}
