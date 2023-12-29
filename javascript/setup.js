/**
 * setup.gs
 */



// Application constants
const APP_TITLE = 'Satoshi_SR_automation'; 
const APP_FOLDER = 'Satoshi_Automation';
const DB_FOLDER = 'Database'; 
const DB_TABLES = 'DATA_SCHEMA_N3'; 
const PROJECTS_FOLDER = 'Projects';
const CONFIG_FOLDER = 'Config';
const CLIO_FOLDER = 'Clio';

const TRIGGER_SMTP = 'eventListener';
const TRIGGER_TABLES = 'onChangeTables';
const TRIGGER_TIME_INTERVAL = 1; // minute

const TRIGGER_TEST = 'testIntegration';
const TRIGGER_TEST_INTERVAL = 1; //every day
const TRIGGER_TEST_TIME = 3; // at 3am




// Get configuration constants as a JSON object
function readConfigFile(){
  const config_folder = getFolder_(CONFIG_FOLDER);
  const config_file = DriveApp.getFileById(getFile_('config.json', config_folder).getId());
  var data = JSON.parse(config_file.getBlob().getDataAsString());
  return data;
}


/**  
 * Install triggers 
 */
function installTriggers() {
  
  // If time-driven trigger already exists, remove them
  removeTriggers();
  
  // Intall new triggers
  var printLog = function(triggerName) {
    console.log(`New trigger with Handler Function of '${triggerName}' created.`);
    console.log(`'${triggerName}' executed.`);
  };
  gmailTrigger_();
  printLog(TRIGGER_SMTP);
  spreadsheetTrigger_(); 
  printLog(TRIGGER_TABLES);
  testIntegrationTrigger_(); 
  printLog(TRIGGER_TEST); 


};


/** 
 * Uninstall triggers 
 */
function removeTriggers() {
  const projectTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < projectTriggers.length; i++) {
    var delTrigger = function(triggerName, index) {
      ScriptApp.deleteTrigger(projectTriggers[index]);
      console.log(`Existing trigger with Handler Function of '${triggerName}' removed.`);
    };
    if (projectTriggers[i].getHandlerFunction() == TRIGGER_SMTP) {delTrigger(TRIGGER_SMTP,i)};
    if (projectTriggers[i].getHandlerFunction() == TRIGGER_TABLES) {delTrigger(TRIGGER_TABLES,i)};
    if (projectTriggers[i].getHandlerFunction() == TRIGGER_TEST) {delTrigger(TRIGGER_TEST,i)};
  }
};


/** 
 * Triggers definition 
 */
function gmailTrigger_(){
  ScriptApp.newTrigger(TRIGGER_SMTP)
    .timeBased()
    .everyMinutes(TRIGGER_TIME_INTERVAL)
    .create();
};

function spreadsheetTrigger_() {
  ScriptApp.newTrigger(TRIGGER_TABLES)
    .timeBased()
    .everyMinutes(TRIGGER_TIME_INTERVAL)
    .create();
};

function testIntegrationTrigger_() {
  ScriptApp.newTrigger(TRIGGER_TEST)
    .timeBased()
    .atHour(TRIGGER_TEST_TIME)
    .everyDays(TRIGGER_TEST_INTERVAL)
    .create();
};

