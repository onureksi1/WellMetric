const { DataSource } = require('typeorm');
const { Subscription } = require('./dist/modules/billing/entities/subscription.entity');
const { ProductPackage } = require('./dist/modules/billing/entities/product-package.entity');

const ds = new DataSource({
  type: 'postgres',
  url: 'postgres://wellanalytics:changeme@localhost:5432/wellanalytics_db',
  entities: [Subscription, ProductPackage],
});

async function test() {
  await ds.initialize();
  const subRepo = ds.getRepository(Subscription);
  const sub = await subRepo.findOne({
    where: { consultant_id: 'caed7502-8393-4421-9e3e-78cf340b52bd', status: 'active' },
    relations: ['package'],
  });
  console.log('SUB:', JSON.stringify(sub, null, 2));
  await ds.destroy();
}

test();
