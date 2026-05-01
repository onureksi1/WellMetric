const fs = require('fs');
const content = fs.readFileSync(process.argv[2], 'utf8');

const openingDivs = (content.match(/<div/g) || []).length;
const closingDivs = (content.match(/<\/div>/g) || []).length;

console.log(`Opening divs: ${openingDivs}`);
console.log(`Closing divs: ${closingDivs}`);

if (openingDivs !== closingDivs) {
  console.error('MISMATCH!');
} else {
  console.log('Match!');
}
