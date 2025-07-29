const cron = require('node-cron');
const syncStatus = require('./model/syncstatus.model');
 
const {runFullSyncFunction} = require('./controller/sync.controller');

const syncCron = cron.schedule("*/10 * * * * *",async ()=>{
  console.log('check',new Date());
  let syncData = await syncStatus.findOne({},'');
  let wholesale_product = syncData?.wholesale_product;
  let retail_product = syncData?.retail_product;
if(wholesale_product===true && retail_product===true){
  console.log('cron');
  await syncStatus.findOneAndUpdate({}, { syncing: false });
}
    await runFullSyncFunction();
});
cron.schedule("* * * * * *",async ()=>{
  let syncData = await syncStatus.findOne({},'');
  let syncing = syncData?.syncing;
  if(syncing){
    syncCron.start();
  }else{
    syncCron.stop();
  }
});


