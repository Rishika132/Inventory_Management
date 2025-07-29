const cron = require('node-cron');
const syncStatus = require('./model/syncstatus.model');
 
const {runFullSyncFunction} = require('./controller/sync.controller');

const syncCron = cron.schedule("*/30 * * * * *",async ()=>{
  console.log('check',new Date());
  let {wholesale_product,retail_product} = await syncStatus.findOne({},'');
if(wholesale_product===true && retail_product===true){
    syncStatus.findOneAndUpdate({}, { syncing: false });
}
    await runFullSyncFunction();
});
cron.schedule("* * * * * *",async ()=>{
  let syncing = await syncStatus.findOne({},'');
  // console.log("Syncing ",syncing);
  if(syncing){
    syncCron.start();
  }else{
    syncCron.stop();
    
  }
});


