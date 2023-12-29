/** 
 * SMTP_requests_handler.gs
 */

const TAG_REQUEST_EMAIL = 'Service_';
const TAG_FORM_EMAIL = 'Form_';
const JOB_SCHEDULE = 'newer_than:1h';


/** 
 * Gmail service threads time-based event listener. 
 * Creates a unique requestID+accountID whenever upsert ops on tables.
 * 
 * @param {object} event
 */
function eventListener() {
  // FIFO containers
  let queuedRequests = [];
  let queuedForms = [];

  // Get Gmail service recent threads
  var threads = GmailApp.search(JOB_SCHEDULE)
  
  // Process threads
  // TODO: replace msgcount... won't work when deployed...
  for (var i = 0; i < threads.length; i++) {
    
    // New requests
    if (threads[i].getMessageCount()<2) {
      let msg = threads[i].getMessages()[0];
      let msg_subject = msg.getSubject(); 
      
      // New requests
      if (msg_subject.match(TAG_REQUEST_EMAIL) !== null) {
        let answers_dict = parseReceivedEmail(msg, msg_subject); // {requestID, sr_type, data}
        queuedRequests.push(answers_dict);
        GmailApp.moveMessageToTrash(msg)
        //Deprecated: if (Number(answers_dict['sr_type'][0]) != 0) {GmailApp.moveMessageToTrash(msg)};
      }
    
      // New forms
      if (msg_subject.match(TAG_FORM_EMAIL) !== null) {
        let answers = parseReceivedEmail(msg);
        queuedForms.push(answers);
        GmailApp.moveMessageToTrash(msg);
      }
    }
  }

  // Process items in containers
  if (queuedRequests.length > 0){
    //for (var i = 0; i<queuedRequests.length;i++) {
      //console.log(queuedRequests[i]);
    // check if requestID is already in the table before creating new row
    insertNewRequestInTable(queuedRequests);
    //}
  };
  if (queuedForms.length > 0) {
    for (var i = 0; i<queuedForms.length;i++) { 
      updateAccountTable(queuedForms[i]);
    }
  };
  return true; // just to signal that the function has run
}


/** 
 * Send an email whenever a new service_1 request is detected.
 * Uses template << msg_body.html
 * 
 * @param {string} recipient email address
 * @param {string} email subject
 * @param {string} email body
 * @param {object} attachement (mimetype/PDF)
*/
function sendNewEmail(email,subject,body,file_object) {
  file_object = file_object || undefined;
  const ImageBlob = DriveApp.getFileById('1VFxZwMdGgFVr6FQ-WfSViUyEou2EhTwr').getBlob().setName('logo');
  var params = {
    to:email,
    subject:subject,
    htmlBody: body,
    inlineImages: {image: ImageBlob},
    };
  if (file_object != undefined) {params['attachments']=[file_object.getAs(MimeType.PDF)]};
  MailApp.sendEmail(params);
  
  // delete pdf_form and empty trash
  if (file_object !== undefined) {
    file_object.setTrashed(true);
    Drive.Files.emptyTrash();
    console.log(`New email sent to ${email} with file ${file_object.getName()}.${file_object.getMimeType().match(/(?<=\/)[\w]+/)[0]}`);
  } else {
    console.log(`New email sent to ${email}`);
  };
  
}


/** Parse requests and forms data. 
 * 
 * @param {string} email msg
 * @param {string} subject
 * @return {object} answers as a map(string:string)
*/
function parseReceivedEmail(msg, subject) {
  subject = subject || undefined;
  let usermail;
  if (msg.getFrom().match(/(?<=[\<]+)[\S]+(?=[\>]+)/g) != null) {
    usermail = msg.getFrom().match(/(?<=[\<]+)[\S]+(?=[\>]+)/g)
  } else {usermail = String(msg.getFrom())};
  
  let data = msg.getPlainBody().split("\n");
  
  if (subject != undefined) {
    //var date = thread.getDate().toString().split(" ");
    let rtype = subject.split("_");
    let parsed_data;
    if (data.length>3) {
      parsed_data = [ data[0].replace("\r",""), data[1].replace("\r",""), data[2].replace("\r",""), data[3].replace("\r","") ]
    } else {parsed_data = msg.getPlainBody().replace("\r","").replace("\n","").split(' ')};
    
    var answers_dict = {
      "requestID":msg.getId(), 
      "sr_type":[ rtype[1].split(" - ")[0], rtype[1].split(" - ")[1] ], // [service_index, service_name]
      "data": parsed_data, //[fname, lname, email, msg] 
    };
    return answers_dict;
  } else {
    let tables = getSpreadSheet_(DB_TABLES, getFolder_(DB_FOLDER));
    let accounts_table = tables.getSheets()[1];
    let row_index = iterateOverTableRowsByColumn(accounts_table, 4, String(usermail));
    console.log(usermail, row_index, msg.getFrom());

    let key = accounts_table.getRange(Number(row_index)+2,1).getValue();
    let encrypted_data = data.toString(); /** TODO: check msg.body format */
    let answers = new Array(key, decrypt(encrypted_data, key));
    return answers;
  }
} 

