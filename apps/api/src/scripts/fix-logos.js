const fs = require('fs');
const path = require('path');

const dirs = [
  '/Users/onureksi/Desktop/wellanalytics/apps/api/src/modules/notification/templates/tr',
  '/Users/onureksi/Desktop/wellanalytics/apps/api/src/modules/notification/templates/en'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the logo image in header
    const logoRegex = /<div class="header"[^>]*>([\s\S]*?)<img[^>]+src="([^"]+logo\.png)"[^>]*>([\s\S]*?)<\/div>/i;
    const match = content.match(logoRegex);
    
    if (match) {
      const logoHtml = `<div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="${match[2]}" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>`;
      
      // Remove logo from header
      content = content.replace(logoRegex, '<div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>');
      
      // Place logo before footer
      content = content.replace('<div class="footer"', logoHtml + '\n    <div class="footer"');
      
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${file}`);
    }
  });
});
