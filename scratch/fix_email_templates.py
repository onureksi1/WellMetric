import os
import re

template_dir = 'apps/api/src/modules/notification/templates/tr'
files = [f for f in os.listdir(template_dir) if f.endswith('.html')]

old_pattern = r'<div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_logo_url}}" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\s*<div class="footer" style="text-align:center;padding:20px 0 10px;">\s*{{#if brand_logo_url}}\s*<img\s*src="{{brand_logo_url}}"\s*alt="{{brand_name}}"\s*style="height:28px;width:auto;object-fit:contain;\s*margin-bottom:8px;display:block;margin-left:auto;\s*margin-right:auto;opacity:0.75;"\s*/>\s*{{else}}\s*<p style="font-weight:500;font-size:13px;\s*color:#666;margin-bottom:8px;">\s*{{brand_name}}\s*</p>\s*{{/if}}'

new_content = """    </div>
    
    <div class="footer" style="text-align:center;padding:30px 0 20px; border-top: 1px solid #eee;">
      {{#if brand_logo_url}}
      <a href="{{platform_url}}" target="_blank" style="text-decoration:none;">
        <img
          src="{{brand_logo_url}}"
          alt="{{brand_name}}"
          style="height:32px;width:auto;object-fit:contain;
                 margin-bottom:12px;display:block;margin-left:auto;
                 margin-right:auto;"
        />
      </a>
      {{else}}
      <p style="font-weight:bold;font-size:16px;color:#2E865A;margin-bottom:12px;">
        {{brand_name}}
      </p>
      {{/if}}"""

for filename in files:
    filepath = os.path.join(template_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Use re.DOTALL to match across newlines
    new_body = re.sub(old_pattern, new_content, content, flags=re.MULTILINE | re.DOTALL)
    
    if new_body != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_body)
        print(f"Updated {filename}")
    else:
        print(f"No match for {filename}")
