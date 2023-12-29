/**
 * Unit tests definitions
 */
function testInsertNewRequest() {
    try {
      const REQ = mock_request();
      insertNewRequestInTable([REQ]);
      const rid = String(REQ['requestID']);
      let i = iterateOverTableRowsByColumn(requests_table,1,rid);
      let account = requests_table.getRange(Number(i)+2,5).getValue();
      return account;
    } catch (error) {console.error(error);}
  }
  
  function testInsertNewProject(account) {
    try {  
      insertNewProjectInTable(account);
    } catch (error) {console.error(error);}
  }
  
  function testUpdateAccountsTable(data){
    try {
      updateAccountTable(data);
    } catch (error) {console.error(error);}
  }
  
  function testChangeRequestStatusToApproved(account) {
    try {
      let rid = iterateOverTableRowsByColumn(requests_table,5,account);
      requests_table.getRange(Number(rid)+2,6).setValue('Approved');
    } catch (error) {console.error(error);}
  }
  
  function testParse() {
    try {
      let newDoc_body = DocumentApp.openById('1mTHDITREQFOUSj7zH5FuXXSOWUiMfPQF7vq_Y2wPtpE').getBody();
      let lookup_sheet = getSpreadSheet_('Doc_LookupTables', getFolder_(DB_FOLDER)).getSheets()[0];
      let ai = iterateOverTableRowsByColumn(accounts_table, 1, AID);
      parseStmts_(newDoc_body, lookup_sheet,ai);
    } catch (error) {console.error(error);}
  };
  
  
  function testAES(account) {
    const DATA_CLEAR = mock_data_clear();
    console.log(DATA_CLEAR);
    try {
      account = account || KEY;
      let e = encrypt(DATA_CLEAR, account);
      let d = decrypt(`<---ENCRYPTED${e}END--->`, account);
      return d;
    } catch (error) {console.error(error);}
  }
  
  function testCreateSendForm(account) {
    try {
      let params = createForm(account);
      sendNewEmail(params[0], params[1], params[2], params[3]);
    } catch (error) {console.error(error);}
  }
  
  function testCreateDoc() {
    try {
      createDoc(PID,PFOLDERID);
    } catch (error) {console.error(error);}
  }
  
  function testCreateNewInvoice() {
    try {
      let projectID = PID;
      let pfolderID = PFOLDERID;
      createInvoice(projectID, pfolderID);
    } catch (error) {console.error(error);}
  }
  
  function testProofDoc(account) {
    let pindex = iterateOverTableRowsByColumn(projects_table,3,account);
    let purl = projects_table.getRange(Number(pindex)+2,5).getValue();
    let pfolder = DriveApp.getFolderById(String(purl.match(/(?<=\/)(1)[\w\W\d\-]{15,}(?!=\/)/g)[0]));
    console.log(pfolder.getId());
    try {
      let f = pfolder.getFiles();
      while (f.hasNext()) {
        let file = f.next();
        if (file.getMimeType() == 'application/vnd.google-apps.document'){
          let doc = DocumentApp.openById(file.getId());
          let doc_body = doc.getBody();
          let doc_children = doc_body.getNumChildren();
          let d = new Object();
          for (var p=0; p<doc_children; p++){
            var child = doc_body.getChild(p);
            let sc = child.asText().getText().match(/[<>{{}}]{2,}/gi);
            if (sc!=undefined && sc!=null && sc.length>0) { for (e of sc) {d[e]=p} };
          };
          var a = function() {let q = new Array(); for (m of Object.keys(d)){q.push(` ${m} ${d[m]}`)}; return q;};
          console.log(`Found ${Object.keys(d).length} errors in generated document ${doc.getName()} : ${a()}`);
        }
      }
    } catch (error) {console.error(error);}
  }
  
  function testExportClio(accountID) {
    try {
      let pindex = iterateOverTableRowsByColumn(projects_table,3,accountID);
      let purl = projects_table.getRange(Number(pindex)+2,5).getValue();
      let pfolderID = DriveApp.getFolderById(String(purl.match(/(?<=\/)(1)[\w\W\d\-]{15,}(?!=\/)/g)[0])).getId();
      exportClio(accountID,pfolderID)
    } catch (error) {console.error(error);}
  }
  
  function testAnalytics(account) {
    try {
      let i = iterateOverTableRowsByColumn(requests_table, 5, account);
      updateAnalytics(i);
    } catch (error) {console.error(error);}
  }
  
  
  /** 
   * Integration tests definitions
   */
  function testIntegration() {
    // DAG definition
    removeTriggers();
    try {
      testIntegrationGenDocs();
      Utilities.sleep(TRIGGER_TIME_INTERVAL*3000);
      testIntegrationEventListeners();
    } catch (error) {console.error(error)};
    installTriggers();
  }
  
  function cleanUp(account) {
    account = account || undefined;
    if (account !==undefined) {
      // remove files&folders + delete tables entries
      let aindex = iterateOverTableRowsByColumn(accounts_table,1,account);
      let pindex = iterateOverTableRowsByColumn(projects_table,3,account);
      let purl = projects_table.getRange(Number(pindex)+2,5).getValue();
      let bid = projects_table.getRange(Number(pindex)+2,4).getValue();
      let bindex = iterateOverTableRowsByColumn(billings_table,1,bid);
      let tindex = analytics_table.getLastRow();
      let rid = iterateOverTableRowsByColumn(requests_table,5,KEY);
  
      DriveApp.getFolderById(String(purl.match(/(?<=\/)(1)[\w\W\d\-]{15,}(?!=\/)/g)[0])).setTrashed(true);
      accounts_table.deleteRow(Number(aindex)+2);
      projects_table.deleteRow(Number(pindex)+2);
      billings_table.deleteRow(Number(bindex)+2);
      analytics_table.deleteRow(tindex);
      if ( (rid !== undefined) && (rid != null) ) {requests_table.deleteRow(rid+2)};
      SpreadsheetApp.flush();
      
      cleanClio();
    } else if (account === undefined) {
      let trows = requests_table.getLastRow();
      for (var i=0;i<trows;i++) {
        let flag = requests_table.getRange(i+1,7).getValue();
        if (flag == 'testIntegrationEventListeners()') {requests_table.deleteRow(i+1)};
      }
    };
    
    Drive.Files.emptyTrash();
  }
  
  function cleanClio() {
    // get Clio folder
    const parentFolder = DriveApp.getRootFolder();
    const subFolders = parentFolder.getFolders();
    const date_now = new Date().getTime();
    var cfolder = function() {while (subFolders.hasNext()) {let folder = subFolders.next(); if (folder.getName() === CLIO_FOLDER) {return folder}}};
    let folders = cfolder().getFolders();
    while (folders.hasNext()) {
      let f = folders.next(); 
      let entry_lifetime = date_now - f.getLastUpdated().getTime();
      if (entry_lifetime < 15*60*1000) {f.setTrashed(true)} // delete every entry more recent than 15 min
    };
  
  }
  
  function testIntegrationGenDocs() {
    try {
      // DAG definition
      const account = testInsertNewRequest();
      //testCreateSendForm(account);
      let data_collected = testAES(account);
      testUpdateAccountsTable([account, data_collected]);
      Utilities.sleep(2000);
      testInsertNewProject(account);
  
      // Proof generated doc
      testProofDoc(account);
  
      // Delete artifacts
      Utilities.sleep(2000);
      cleanUp(account);  
    } catch (error) {console.error(error);};
  }
  
  
  
  function testIntegrationEventListeners() {
    let toAdmin = readConfigFile()["userGroups"]["role/owner"]["ids"][0];
    let body = `Integration test michaelgarancher1@gmail.com testIntegrationEventListeners()`;
    let subjects = new Array();
    let types = readConfigFile()['requestType'];
    
    try {
      for (var i=0; i<Object.keys(types).length; i++) {
        subjects.push(`${TAG_REQUEST_EMAIL}${i} - ${types[i]}`);
      };
      for (subject of subjects) {
        sendNewEmail(toAdmin,subject,body);
      };
  
      let rid = requests_table.getLastRow()+1;
      requests_table.getRange(rid,1).setValue(createID());
      requests_table.getRange(rid,2).setValue('1');
      requests_table.getRange(rid,3).setValue('Politique de confidentialité');
      requests_table.getRange(rid,4).setValue(new Date().toDateString());
      requests_table.getRange(rid,5).setValue(KEY);
      requests_table.getRange(rid,6).setValue('Received');
      requests_table.getRange(rid,8).setValue(new Date().getTime());
  
      let index = accounts_table.getLastRow()+1;
      accounts_table.getRange(index,1).setValue(KEY);
      accounts_table.getRange(index,2).setValue('Integration');
      accounts_table.getRange(index,3).setValue('Test');
      accounts_table.getRange(index,4).setValue(toAdmin);
      SpreadsheetApp.flush();
      
      sendNewEmail(toAdmin,TAG_FORM_EMAIL,DATA_ENCRYPTED);
    
      Utilities.sleep(TRIGGER_TIME_INTERVAL*10000);
      if (eventListener()==true) {
        Utilities.sleep(TRIGGER_TIME_INTERVAL*10000);
        onChangeTables();
      };
      
      // Delete artifacts
      Utilities.sleep(2000);
      cleanUp(KEY);
      cleanUp();
    } catch (error) {console.error(error);};
  }
  
  
  
  
  
  