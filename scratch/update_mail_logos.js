const { Client } = require('pg');

async function updateTemplates() {
  const client = new Client({
    connectionString: "postgres://wellanalytics:changeme@localhost:5432/wellanalytics_db"
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const res = await client.query('SELECT id, body_tr, body_en FROM mail_templates');
    
    for (const row of res.rows) {
      let updatedTr = row.body_tr;
      let updatedEn = row.body_en;

      // Replace header h1 with img
      const logoHtml = '<img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;">';
      
      if (updatedTr && updatedTr.includes('<h1>🌱 Wellbeing Platformu</h1>')) {
        updatedTr = updatedTr.replace('<h1>🌱 Wellbeing Platformu</h1>', logoHtml);
      }
      
      if (updatedEn && updatedEn.includes('<h1>🌱 Wellbeing Platformu</h1>')) {
        updatedEn = updatedEn.replace('<h1>🌱 Wellbeing Platformu</h1>', logoHtml);
      }

      await client.query(
        'UPDATE mail_templates SET body_tr = $1, body_en = $2 WHERE id = $3',
        [updatedTr, updatedEn, row.id]
      );
      console.log(`Updated template: ${row.id}`);
    }

    console.log('All templates updated successfully');
  } catch (err) {
    console.error('Error updating templates:', err);
  } finally {
    await client.end();
  }
}

updateTemplates();
