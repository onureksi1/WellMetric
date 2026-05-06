const fs = require('fs');
const path = require('path');

// Fixed path to be absolute or correctly relative to execution context
const templatesDir = '/Users/onureksi/Desktop/wellanalytics/apps/api/src/modules/notification/templates';

const newFooter = `    <div class="footer" style="text-align:center;padding:20px 0 10px;">
      {{#if brand_logo_url}}
      <img
        src="{{brand_logo_url}}"
        alt="{{brand_name}}"
        style="height:28px;width:auto;object-fit:contain;
               margin-bottom:8px;display:block;margin-left:auto;
               margin-right:auto;opacity:0.75;"
      />
      {{else}}
      <p style="font-weight:500;font-size:13px;
                 color:#666;margin-bottom:8px;">
        {{brand_name}}
      </p>
      {{/if}}
      <p style="font-size:11px;color:#999;margin:0;">
        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.
      </p>
    </div>`;

function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Match the entire footer div block
      // Pattern: <div class="footer"> ... </div>
      const footerRegex = /<div class="footer">[\s\S]*?<\/div>/g;
      
      if (footerRegex.test(content)) {
        console.log(`Updating footer in: ${filePath}`);
        const updatedContent = content.replace(footerRegex, newFooter);
        fs.writeFileSync(filePath, updatedContent);
      }
    }
  }
}

walk(templatesDir);
console.log('Footer update complete.');
