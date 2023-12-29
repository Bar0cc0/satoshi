/** 
 * DBMS_utilities.gs
 */



// Restricted
const tables = getSpreadSheet_(DB_TABLES, getFolder_(DB_FOLDER));
const requests_table = tables.getSheets()[0];
const accounts_table = tables.getSheets()[1];
const projects_table = tables.getSheets()[2];
const billings_table = tables.getSheets()[3];
const analytics_table = tables.getSheets()[4];



/** 
 * Tables onChange() event listener.
 * Function encapsulates the logic of data integration.
 * 
 * @param {object} event
 */
function onChangeTables() {
  let activeSheet = requests_table;
  let activeSheet_lastRow = activeSheet.getLastRow();

  for (var i=0; i<activeSheet_lastRow; i++) {
    let serviceType = activeSheet.getRange(i+2,2).getValue()
    let serviceStatus = activeSheet.getRange(i+2,6).getValue()
    let linkedAccountID = activeSheet.getRange(i+2,5).getValue();
    let lastModified = new Date().getTime() - activeSheet.getRange(i+2,8).getValue();
    
    if ( (lastModified <= 60000*TRIGGER_TIME_INTERVAL) && (serviceType == '1') ) {
      if (serviceStatus == 'Received') {
        let params = createForm(linkedAccountID);
        sendNewEmail(params[0], params[1], params[2], params[3]); //usermail, subject, msg_body, attached_pdf
      } else if (serviceStatus == 'Pending') {
        insertNewProjectInTable(linkedAccountID);
      };
    } else if ((serviceType == '0') && (serviceStatus == 'Approved') ) {
      requests_table.deleteRow(i+2);
    }
  }
}
 

/** Insert new record into tables 
 * 
 * @param {object} queued requests
 * @return {bool} 
 */
function insertNewRequestInTable(queue) {

  const service_name = readConfigFile()['requestType'];

  try {
    for (var i = 0; i < queue.length; i++) {
      let requestID = String(queue[i]['requestID']);
      let rtype = Number(queue[i]['sr_type'][0]);

      try{ // check if reqID already exists
        var index = iterateOverTableRowsByColumn(requests_table, 1, requestID);
        if (index != undefined) {console.log(`Request ${rid} already exists.`);};
      } catch {return false;}
      
      let r_startRow = requests_table.getLastRow() + 1;
      let a_startRow = accounts_table.getLastRow() + 1;
      
      requests_table.getRange(r_startRow, 1).setValue(requestID);
      requests_table.getRange(r_startRow, 2).setValue(rtype);
      requests_table.getRange(r_startRow, 3).setValue(service_name[rtype]);
      requests_table.getRange(r_startRow, 4).setValue(new Date().toISOString());
      requests_table.getRange(r_startRow, 7).setValue(String(queue[i]['data'][3])); // msg
      requests_table.getRange(r_startRow, 8).setValue(new Date().getTime());

      if (Number(rtype)==0) {
        requests_table.getRange(r_startRow, 6).setValue("Pending");
      } else {
        requests_table.getRange(r_startRow, 6).setValue("Received");
      }

      let a_sheet_cursor = iterateOverTableRowsByColumn(accounts_table, 4, queue[i]['data'][2]);
      
      // if account already exists then
      if (a_sheet_cursor != undefined) {
        var accountID = accounts_table.getRange(Number(a_sheet_cursor)+2, 1).getValue();
        requests_table.getRange(r_startRow, 5).setValue(String(accountID));
      } 

      // else create new accountID and insert data
      else {
        const accountID = createID();
        requests_table.getRange(r_startRow, 5).setValue(accountID);
        accounts_table.getRange(a_startRow, 1).setValue(accountID);
        accounts_table.getRange(a_startRow, 2).setValue(String(queue[i]['data'][0])); // firstname
        accounts_table.getRange(a_startRow, 3).setValue(String(queue[i]['data'][1])); // lastname
        accounts_table.getRange(a_startRow, 4).setValue(String(queue[i]['data'][2])); // email adress
        
        console.log(`New row (${accountID}) inserted in Accounts_Table`);
      }
      console.log(`New row (${requestID}) inserted in Requests_Table`);
    }
    SpreadsheetApp.flush()
    return true; 
  } catch {return false;}
}


/** Update Account table
 * 
 * @param {object} answers from parsed forms as a map(string:string)
 */
function updateAccountTable(answers) {  
  // answers = [ 'key',{ VAR_1: '', ..., VAR_n: '' } ]

  let i = iterateOverTableRowsByColumn(accounts_table, 1, String(answers[0]));
  let z = iterateOverTableRowsByColumn(requests_table, 5, String(answers[0]));

  // Filter new headers to append to the table
  let headers = iterateOverTableColumnsByRow(accounts_table,1);
  let answers_keys = Object.keys(answers[1]);

  for (var key of answers_keys) {
    for (var header of headers){
      if (key.toLowerCase() == header.toLowerCase()){
        delete answers_keys[answers_keys.indexOf(key)]
      }
    }
  }
  answers_keys.sort();
    
  // Add new headers  
  if (answers_keys.length>0) {
    let start_col = accounts_table.getLastColumn();
    answers_keys.forEach(function(value,index,array){accounts_table.getRange(1,start_col+index+1).setValue(value.toLowerCase())});
    console.log(`${answers_keys.length} new headers added. ACCOUNTS_TABLE schema must be regenerated in AppSheet!!!`);
  }

  // Update table with data from answers at row i+2
  Object.keys(answers[1]).forEach( function(value,index,array){
    let hindex=iterateOverTableColumnsByRow(accounts_table,1,value.toLowerCase());
    if (hindex != undefined) {
      //console.log(index, Number(hindex)+1, value, answers[1][value]);
      accounts_table.getRange(Number(i)+2, Number(hindex)+1).setValue(answers[1][value]);
      }; 
  });

  // Update status
  requests_table.getRange(Number(z)+2, 6).setValue(String("Pending"))
  requests_table.getRange(Number(z)+2, 8).setValue(new Date().getTime());

  SpreadsheetApp.flush()
}


/** 
 * Create a new project record once request is approved
 * Delete originating request row in requests table 
 * 
 * @param {string} accountID
 * @return {bool} 
 */
function insertNewProjectInTable(accountID) {
  let i = iterateOverTableRowsByColumn(requests_table, 5, String(accountID));
  
  let p_startRow = projects_table.getLastRow() + 1;
  let p_ID = createID();
  let pfolderID = createNewProjectFolder(p_ID);
  let p_type = requests_table.getRange(Number(i)+2, 2).getValue();

  
  projects_table.getRange(p_startRow,1).setValue(p_ID);
  projects_table.getRange(p_startRow,2).setValue(p_type);
  projects_table.getRange(p_startRow,3).setValue(accountID);
  projects_table.getRange(p_startRow,5).setValue(DriveApp.getFolderById(pfolderID).getUrl());
  SpreadsheetApp.flush();

  createDoc(p_ID, pfolderID);
  createInvoice(p_ID,pfolderID);
  Utilities.sleep(5000);
  exportClio(accountID,pfolderID);
  updateAnalytics(i);

  requests_table.deleteRow(Number(i)+2);
}


/** 
 * Update analytics
 * 
 * @param {int} table index
*/
function updateAnalytics(i) {
  let p_type = requests_table.getRange(Number(i)+2, 2).getValue();
  let p_name = requests_table.getRange(Number(i)+2, 3).getValue();
  let p_subdate = requests_table.getRange(Number(i)+2, 4).getValue();
  let p_lastmod = requests_table.getRange(Number(i)+2, 8).getValue();
  let p_time = new Date().getTime();
  var convert = function(t){let h = Math.floor(t/(60*60)); let m = Math.floor(t/60); let s=Math.floor(t%60); return (`${h}:${m}:${s}`)};
  let lastRow = analytics_table.getLastRow();

  analytics_table.getRange(lastRow+1,1).setValue(p_type);
  analytics_table.getRange(lastRow+1,2).setValue(p_name);
  analytics_table.getRange(lastRow+1,3).setValue(p_subdate);
  analytics_table.getRange(lastRow+1,4).setValue( Math.floor( Number(p_time-p_lastmod)/(1000*60) ) );
  SpreadsheetApp.flush();
}



/** 
 * Helper function to iterate over table rows for a specific column
 * 
 * @param {object}
 * @param {int}
 * @param {string}
 * @return {string}
*/

function iterateOverTableRowsByColumn(current_table, col, value) {
  const row_start = 2; // Ommit headers row
  let row_end = current_table.getLastRow();
  let selectionData = current_table.getRange(row_start, col, row_end).getValues();
  let current_table_name = current_table.getName();
  /*
  try {
    current_table_name = String((current_table.getName()).match(/[\w]+(?=(s\_))/)[0]).toLowerCase(); 
  } catch {
    current_table_name = String(current_table.getName()).toLowerCase();
  }*/
  
  var entity = function() {if (current_table_name == 'request') {return 'account';} else {return current_table_name;}}
  
  let x = 0;
  for (x in selectionData) {
    if (selectionData[x] == value) {
      console.log(`Row ${x} in ${current_table.getName()}, found value ${selectionData[x]} linked to ${entity()}`);
      return x; 
    }
  }
}


/** 
 * Helper function to iterate over table rows for a specific column.
 * If a value is not provided, list of table headers is returned.
 * 
 * @param {object}  table
 * @param {int}     row index
 * @param {string||undefined} column name
 * @return {string} value at (row,colum)
*/
function iterateOverTableColumnsByRow(current_table, row, value) {
  value = value || undefined;
  const col_start = 1;
  let col_end = current_table.getLastColumn();
  let selectionData = current_table.getRange(row, col_start, row, col_end).getValues();
  
  let x = 0;
  for (x in selectionData[0]) {
    if (selectionData[0][x] == value) {
      console.log(`Column ${x} in ${current_table.getName()}, found value ${selectionData[0][x]}`);
      return x; 
    }
  } 
  return selectionData[0];
}


/** 
 * Helper function to generate a unique identifier
 * 
 * @return {string} 
*/
function createID() {
  let seed = new Date().getMilliseconds();
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let i = 0;
  let x = "";
  while (i<18) {
    x += characters.charAt(Math.floor(Math.random() * charactersLength))
    i +=1 ;
  }
  x += Number(seed);
  x = x.split('').sort(function(){return 0.5-Math.random()}).join('');
  return x;  
}
