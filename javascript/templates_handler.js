/** 
 * Creates new form from template and sends to user.
 * 
 * @param {string} account ID
 */
function createForm(accountID) {
    const templates_folder = getFolder_(DB_FOLDER);
    const folder = getFolder_(PROJECTS_FOLDER);
    
    let ri = iterateOverTableRowsByColumn(requests_table, 5, String(accountID));
    let rtype = requests_table.getRange(Number(ri)+2,2).getValue();
  
    if (Number(rtype) > 0) { // service_0 doesn't require any form
      // create new pdf_form with name == accountID
      let pdfTemplate_name = readConfigFile()['templates']['Forms'][Number(rtype)-1]; // index of template in config.json should be equal to template of (rtype - 1) because service_0 !exists
      let pdfTemplate_id = getFile_(pdfTemplate_name, templates_folder).getId(); 
      let newfile = DriveApp.getFileById(pdfTemplate_id).makeCopy(accountID, folder);
  
      // create email headers & body
      let ai = iterateOverTableRowsByColumn(accounts_table, 1, String(accountID));
      let username = String(accounts_table.getRange(Number(ai)+2,2).getValue()) + " " + String(accounts_table.getRange(Number(ai)+2,3).getValue());
      let usermail = accounts_table.getRange(Number(ai)+2,4).getValue();
      const subject = "Satoshi_Form"
  
      let eBodyTemplate_name = (readConfigFile()['templates']['Emails'][Number(rtype)-1]).match(/[\w]+(?=\.)/)[0];
      let eBodyTemplate_id = getFile_(eBodyTemplate_name, templates_folder).getId();
      
      let email_body = DocumentApp.openById(eBodyTemplate_id).getBody().getText();
      email_body = email_body.replace(/{{NAME}}/g, username);
      email_body = email_body.replace(/{{REQUEST}}/g, readConfigFile()['requestType'][Number(rtype)]);
      email_body = email_body.replace(/{{USERMAIL}}/g, usermail);
      
      let params = new Array();
      params.push(usermail);
      params.push(subject);
      params.push(email_body);
      params.push(newfile);
  
      return params;
    }
  }
  
  
  /** 
   * Creates project related invoice from template
   * 
   * @param {string} project id
   * @param {string} project folder id
   */
  function createInvoice(projectID, pfolderID) {
    let pi = iterateOverTableRowsByColumn(projects_table,1,projectID);
    let accountID = projects_table.getRange(Number(pi)+2,3).getValue();
    let ai = iterateOverTableRowsByColumn(accounts_table,1,accountID);
  
    /*
    // fetch template
    let invoiceTemplate_name = (readConfigFile()['templates']['Invoices'].toString()).match(/[\w\_]+(invoice)+(?=\.)/gi)[0];
    let invoiceTemplate_id = getFile_(invoiceTemplate_name, getFolder_(DB_FOLDER)).getId();
    
    // make a temporary xls 
    let newInvoiceSpreadsheet = DriveApp.getFileById(invoiceTemplate_id).makeCopy(`${projectID}_Invoice`, DriveApp.getFolderById(pfolderID));
    let invoice = SpreadsheetApp.open(newInvoiceSpreadsheet).getSheets()[0];
    */
  
    // fill in invoice fields
    let date = new Date(); 
    let billingID = createID();
    let pType_index = projects_table.getRange(Number(pi)+2,2).getValue();
    let pType_name = readConfigFile()['requestType'][`${pType_index}`].toString();
    let pType_amount = readConfigFile()['flatRateBaseAmounts'][`${pType_index}`];
    let client_name = `${accounts_table.getRange(Number(ai)+2,2).getValue()} ${accounts_table.getRange(Number(ai)+2,3).getValue()}`;
    let client_ent = accounts_table.getRange(Number(ai)+2,32).getValue();
    
    /*
    invoice.getRange(8,6).setValue(`${date.getDate()} / ${Number(date.getMonth())+1} / ${date.getFullYear()}` )
    invoice.getRange(9,6).setValue(`${billingID}` );
    invoice.getRange(10,6).setValue(`${accountID}` );
    invoice.getRange(16,3).setValue(`${pType_name}` ); 
    invoice.getRange(16,6).setValue(`${pType_amount}`);
    invoice.getRange(8,3).setValue(`${client_name}`);
    invoice.getRange(9,3).setValue(`${client_ent}`);
    SpreadsheetApp.flush(); // Apply all changes to spreadsheet
    */
  
    // update tables
    let billingsTable_lastRow = billings_table.getLastRow();
    billings_table.getRange(Number(billingsTable_lastRow)+1, 1).setValue(billingID);
    projects_table.getRange(Number(pi)+2,4).setValue(billingID);
    billings_table.getRange(Number(billingsTable_lastRow)+1, 2).setValue(pType_amount);
    billings_table.getRange(Number(billingsTable_lastRow)+1, 3).setValue('Pending');
    billings_table.getRange(Number(billingsTable_lastRow)+1, 4).setValue(DriveApp.getFolderById(pfolderID).getUrl());
    SpreadsheetApp.flush(); // Apply all changes to spreadsheet
  
    /*
    Utilities.sleep(250);   // To avoid any potential latency in creating .pdf
    
    // export PDF
    const url = "https://docs.google.com/spreadsheets/d/" + newInvoiceSpreadsheet.getId() + "/export" +
      "?format=pdf&" +
      "size=letter&" +
      "fzr=true&" +
      "portrait=true&" +
      "scale=4&" +
      "gridlines=false&" +
      "printtitle=false&" +
      "top_margin=0&" +
      "bottom_margin=0&" +
      "left_margin=0&" +
      "right_margin=0&" +
      "sheetnames=false&" +
      "gid=" + invoice.getSheetId();
  
    const params = { method: "GET", headers: { "authorization": "Bearer " + ScriptApp.getOAuthToken() } };
    const blob = UrlFetchApp.fetch(url, params).getBlob().setName(newInvoiceSpreadsheet.getName());
  
    const folder = DriveApp.getFolderById(pfolderID);
    folder.createFile(blob);
  
    // delete temporary xls
    newInvoiceSpreadsheet.setTrashed(true);
    */
  
  }
  
  /** */
  function exportClio(accountID,pfolderID) {
    
    // fetch data
    let pfolder = DriveApp.getFolderById(pfolderID);
    let ai = iterateOverTableRowsByColumn(accounts_table,1,accountID);
    let pi = iterateOverTableRowsByColumn(projects_table,3,accountID);
    var date = function() {let d = new Date(); return `${d.getFullYear()}${Number(d.getMonth())+1}${d.getDate()}`};
    let pid = projects_table.getRange(Number(pi)+2,1).getValue();
    let title = readConfigFile()['requestType'][`${projects_table.getRange(Number(pi)+2,2).getValue()}`].toString();
    let first_name = accounts_table.getRange(Number(ai)+2,2).getValue();
    let last_name = accounts_table.getRange(Number(ai)+2,3).getValue();
    let company = accounts_table.getRange(Number(ai)+2,30).getValue();
    let web_page = accounts_table.getRange(Number(ai)+2,118).getValue();;
    let business_street = accounts_table.getRange(Number(ai)+2,99).getValue();;
    let business_city = accounts_table.getRange(Number(ai)+2,7).getValue();;
    let business_state = accounts_table.getRange(Number(ai)+2,67).getValue();;
    let business_country = accounts_table.getRange(Number(ai)+2,27).getValue();;
    let business_postal_code = accounts_table.getRange(Number(ai)+2,120).getValue();;
    let email_adress = accounts_table.getRange(Number(ai)+2,4).getValue();
  
    // get Clio folder
    const parentFolder = DriveApp.getRootFolder();
    const subFolders = parentFolder.getFolders();
    var cfolder = function() {while (subFolders.hasNext()) {let folder = subFolders.next(); if (folder.getName() === CLIO_FOLDER) {return folder}}};
  
    
    // fetch contact template
    let contactTemplate_name = 'Clio_Contact_Template';
    let contactTemplate_id = getFile_(contactTemplate_name, getFolder_(DB_FOLDER)).getId();
    let newClioContactSpreadsheet = DriveApp.getFileById(contactTemplate_id).makeCopy(`${company}_Clio_Contact`, pfolder);
    let newClioContact = SpreadsheetApp.open(newClioContactSpreadsheet).getSheets()[0];
    let clastrow = newClioContact.getLastRow()+1;
  
    // fetch matters template
    let mattersTemplate_name = 'Clio_Matters_Template';
    let mattersTemplate_id = getFile_(mattersTemplate_name, getFolder_(DB_FOLDER)).getId();
    let newClioMattersSpreadsheet = DriveApp.getFileById(mattersTemplate_id).makeCopy(`${company}_Clio_Matters`, pfolder);
    let newClioMatters = SpreadsheetApp.open(newClioMattersSpreadsheet).getSheets()[0];
    let mlastrow = newClioMatters.getLastRow()+1;
  
    // aggregate data
    newClioContact.getRange(clastrow,1).setValue(title);
    newClioContact.getRange(clastrow,3).setValue(first_name);
    newClioContact.getRange(clastrow,4).setValue(last_name);
    newClioContact.getRange(clastrow,5).setValue(company);
    newClioContact.getRange(clastrow,6).setValue(web_page);
    newClioContact.getRange(clastrow,7).setValue(business_street);
    newClioContact.getRange(clastrow,8).setValue(business_city);
    newClioContact.getRange(clastrow,9).setValue(business_state);
    newClioContact.getRange(clastrow,10).setValue(business_country);
    newClioContact.getRange(clastrow,11).setValue(business_postal_code);
    newClioContact.getRange(clastrow,12).setValue(email_adress);
    newClioMatters.getRange(mlastrow,1).setValue('Open');
    newClioMatters.getRange(mlastrow,3).setValue(accountID);
    newClioMatters.getRange(mlastrow,4).setValue(title);
    newClioMatters.getRange(mlastrow,5).setValue(date());
    newClioMatters.getRange(mlastrow,8).setValue(pid);
    newClioMatters.getRange(mlastrow,9).setValue('PC gdoc generated');
    newClioMatters.getRange(mlastrow,10).setValue(company);
    newClioMatters.getRange(mlastrow,11).setValue(first_name);
    newClioMatters.getRange(mlastrow,12).setValue(last_name);
    SpreadsheetApp.flush();
  
    // export to csv
    const params = { method: "GET", headers: { "authorization": "Bearer " + ScriptApp.getOAuthToken() } };
    const urlcontact = "https://docs.google.com/spreadsheets/d/" + newClioContactSpreadsheet.getId() + "/export" +"?format=csv";
    const blobcontact = UrlFetchApp.fetch(urlcontact, params).getBlob().setName(newClioContactSpreadsheet.getName());
    pfolder.createFile(blobcontact);
    const urlmatters = "https://docs.google.com/spreadsheets/d/" + newClioMattersSpreadsheet.getId() + "/export" +"?format=csv";
    const blobmatters = UrlFetchApp.fetch(urlmatters, params).getBlob().setName(newClioMattersSpreadsheet.getName());
    pfolder.createFile(blobmatters);
    
    // delete temporary xls
    newClioContactSpreadsheet.setTrashed(true);
    newClioMattersSpreadsheet.setTrashed(true);
    
    // make copy folder -> move to clio
    let folder_copy = pfolder.createFolder(`${date()}_${company}_${title}`);
    let files = pfolder.getFiles();  
    while (files.hasNext()) {
      let file = files.next();
      let fileID = file.getId();
      DriveApp.getFileById(fileID).makeCopy(file.getName(),folder_copy);
    };
    let clio = cfolder();
    folder_copy.moveTo(clio);
    
  }
  
  
  /** */
  function createDoc(projectID, projectFolderID) {
    // Load templates & create new doc
    const pi = iterateOverTableRowsByColumn(projects_table, 1, String(projectID));
    let account = projects_table.getRange(Number(pi)+2, 3).getValue();
    const ri = iterateOverTableRowsByColumn(requests_table, 5, String(account));
    const ai = iterateOverTableRowsByColumn(accounts_table, 1, String(account));
  
    let dict = readConfigFile()['requestType'];
    let docType_index = requests_table.getRange(Number(ri)+2, 2).getValue();
    let docType_title = dict[String(docType_index)].split(' ');
    
    let docTemplate_name = Object.values(readConfigFile()['templates']['Documents'][docType_index]).toString().match(/[\w\_]+(template)+(?=\.)/gi)[0];
    let docTemplate_id = getFile_(docTemplate_name, getFolder_(DB_FOLDER)).getId();
    
    let pdate = new Date();
    pdate = `${pdate.getFullYear()}${pdate.getMonth()}${pdate.getDate()}`;
    let client_name = accounts_table.getRange(Number(ai)+2,30).getValue();
    
    let newDoc_title = [pdate, client_name, docType_title[0], docType_title[docType_title.length-1]].join('_'); 
    let newDoc = DriveApp.getFileById(docTemplate_id).makeCopy(`${newDoc_title}`, DriveApp.getFolderById(projectFolderID));
    let newDoc_obj = DocumentApp.openById(newDoc.getId());
    let newDoc_body = newDoc_obj.getBody();
  
    let lookupTables_name = Object.values(readConfigFile()['templates']['Documents'][docType_index]).toString().match(/[\w\_]+(lookuptables)+(?=\.)/gi)[0]; 
    const lookupTables = getSpreadSheet_(lookupTables_name, getFolder_(DB_FOLDER));
    const lookup_sheet = lookupTables.getSheets()[Number(docType_index)-1];
  
    // Parse templating elements (i.e. statements & expressions) 
    parseStmts_(newDoc_body, lookup_sheet, ai);
    
    newDoc_obj.saveAndClose();
  };
  
  
  
  /** */
  function parseStmts_(newDoc_body, lookup_sheet, ai) {
  
    // Base operators definition
    var if_ = function(v){
      var p = (v.match(/(?<=\{)[\w\d]+(?=\})/i)[0]);
      var col_index = iterateOverTableColumnsByRow(accounts_table, 1, p.toLowerCase());
      var col_value = accounts_table.getRange(Number(ai)+2, Number(col_index)+1).getValue();
      let lookup_index = iterateOverTableRowsByColumn(lookup_sheet, 1, p);
      let exp  = new Array();
      if (col_value.toLowerCase()!='non' && col_value.length>0) {
        if (lookup_index!=undefined) {
          var lookup_value = lookup_sheet.getRange(Number(lookup_index)+2, 2).getValue()};
          exp.push(true, p, lookup_value);
      } else {
        if (lookup_index!=undefined) {
          var lookup_value = lookup_sheet.getRange(Number(lookup_index)+2, 3).getValue()};
          exp.push(false, p, lookup_value);
      };
      return exp; 
    };
  
    var for_ = function(v){
        let exp = new Object();
        let range = new Array();
        let accountTable_headers = iterateOverTableColumnsByRow(accounts_table, 1);
        for (h in accountTable_headers) {
          let hm = accountTable_headers[h].match(/(\w)+(?=\d{1,})/i);
          if (hm!==null && `{{${hm[0]}}}`==v.toLowerCase()) { 
            let range_val = accounts_table.getRange(Number(ai)+2, Number(h)+1).getValue();
            if (range_val.toLowerCase()!='non' && range_val.length>0){
              let tmp = new Object;
              if (range_val.toLowerCase()=='oui') {
                let eval = if_('{{'+accountTable_headers[h].toUpperCase()+'}}');
                tmp[accountTable_headers[h]] = eval[2];
                range.push(tmp);
              } else {
                tmp[accountTable_headers[h]] = range_val;
                range.push(tmp);
              };
            };
          };
        };
        exp[v] = range;
        return exp;
    };
  
  
    // Parse & execute statements (i.e., if/elif/for/:/&&/&!)
    
    let corr_counter = 1;
    let termination_countdown = 5;
    
    while ((corr_counter>0) && (termination_countdown>0)) {
      
      termination_countdown -=1;
  
      let stmts_list = new Object( newDoc_body.getText().match(/(\<{2}\s+)[\w\d\s\:\&\!\{\}\(\)\?\[\]éèëêàäâùûô]+(\s+\>{2})/gi) );
      corr_counter = stmts_list.length;
  
      if (corr_counter!=undefined) {
        try {
          stmts_list.forEach( function(value,index,array){
            
            let stmt_opr = value.match(/(?<=\<{2}\s+)[\w\d\s\&\!]+(?=\s+\{{2})/gi);
            let stmt_log = value.match(/(?<=\s+)[\&\!]{2}(?=\s+)/gi);
            let stmt_var = value.match(/(\{{2})[\w\d]+(\}{2})/gi);
            let stmt_split = value.split(':');
  
            if (stmt_split.length == 1) {
  
                //console.log(stmt_split[0], stmt_opr, stmt_log, stmt_var);
                if (stmt_opr[0]=='if') {
                  let eval = if_(stmt_var[0]);
                  if (eval[0]) {
                    newDoc_body.replaceText(value, eval[2]);
                  } else {
                    newDoc_body.replaceText(value, '');
                  };
  
                } else if (stmt_opr[0]=='elif'){
                    let eval = if_(stmt_var[0]);
                    newDoc_body.replaceText(value, eval[2]);
  
                } else if (stmt_opr[0]=='for') {
                  let iterator = for_(stmt_var[0]);
                  formatList_(newDoc_body,value,iterator[stmt_var[0]]);
                  let replacement_string = '';
                  for ( item of iterator[stmt_var[0]] ) {
                    let p = Object.values(item)[0];
                    if (p!=undefined) {replacement_string += String(p+' ')}
                  };
                  newDoc_body.replaceText(value, replacement_string);
                };
  
              
              
            } else if (stmt_split.length == 2) {
              if (stmt_opr[0]=='if') {
                if (stmt_log==null) {
                  let v = if_(stmt_var[0]);
                  if (v[1]) {
                    let evl = stmt_split[1].trimStart().replace('>>','');
                    newDoc_body.replaceText(value, evl);
                    newDoc_body.replaceText(`<< if ${stmt_var[0]} : `, '');
                  }
                } else if (stmt_log!=null) {
                
                  let eval_0 = if_(stmt_var[0]);
                  let eval_1 = if_(stmt_var[1]);
                  
                  if (stmt_log[0]=='&&') {
                    if ( eval_0[0] && eval_1[0]) {
                      console.log('TRUE');
                      let ev = stmt_split[1].trimStart().replace('>>','');
                      newDoc_body.replaceText(value, ev);
                    } else if ( !(eval_0[0] && eval_1[0]) ) {
                      console.log('FALSE');
                      newDoc_body.replaceText(`<< if ${stmt_var[0]} ${stmt_log[0]} ${stmt_var[1]} : `, '');
                      newDoc_body.replaceText(value, '');
  
                    }
                  } else if (stmt_log[0]=='&!') {
                    if (eval_0[0] && !eval_1[0]) {
                      let ev = stmt_split[1].trimStart().replace('>>','');
                      newDoc_body.replaceText(value, ev);
                    } else {
                      newDoc_body.replaceText(value, '');
                    }
                  }
                }
              };
            };
          })
        } catch {} 
      }
    };
  
    // Replace expressions (i.e., {{VAR}})
    let accountTable_headers = iterateOverTableColumnsByRow(accounts_table, 1);
    let newDoc_vars = newDoc_body.getText().match(/([{]){2}\w+([}]){2}/g);
  
    for (var v in newDoc_vars) {
      for (var h in accountTable_headers) {
        if (newDoc_vars[v].toLowerCase() == `{{${accountTable_headers[h].toLowerCase()}}}`) {
          let q = accounts_table.getRange(Number(ai)+2, Number(h)+1).getValue();
          if (q!=undefined) {newDoc_body.replaceText(newDoc_vars[v], q);}
        }
      }
    };
  
    // Formatting
    try {newDoc_body.replaceText('{{DATE}}', new Date().toLocaleDateString())} catch{};
    let hk = newDoc_body.getText().match(/[\<\>]{2}/gi);
    if (hk!=undefined && hk!=null){for (item of hk) {newDoc_body.replaceText(item,'')}}
  
  };
  
  
  
  /** */
  function formatList_(newDoc_body,stmt,l) {
    let bc = newDoc_body.getNumChildren();
    let ll = new Array();
    for(var i=0;i<bc;i++) { 
      var child=newDoc_body.getChild(i);
      if (child.asText().findText(stmt)){
        if(child.getType()==DocumentApp.ElementType.LIST_ITEM) {
          ll.push(i);
        }
      }
    };
  
    if (ll.length>0) {
      
      let k = 0;
      for (var j=0;j<ll.length;j++){
        let child_listItem = newDoc_body.getChild(ll[j]+k).asListItem();
        let glyph = child_listItem.getGlyphType();
        let align = child_listItem.getIndentFirstLine();
        let indent = child_listItem.getIndentStart();
        let hStyle = {};
        hStyle[DocumentApp.Attribute.FONT_SIZE] = child_listItem.getAttributes()[DocumentApp.Attribute.FONT_SIZE];
  
        let z = 0;
        for (item of l){
          let p = Object.values(item)[0];
          newDoc_body.insertListItem( (ll[j]+k) + (z+1), p).setIndentFirstLine(align).setIndentStart(indent).setGlyphType(glyph).setAttributes(hStyle);
          z+=1;
        };
  
        newDoc_body.removeChild(newDoc_body.getChild(ll[j]+k));
    
        k+=(j+l.length-1);
      }
    }  
  };
  