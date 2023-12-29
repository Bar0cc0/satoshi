/** */
const DEFAULT_OUTPUT_TEXT = '';

function onHomepage(e) {
  return createSelectionCard(e, DEFAULT_OUTPUT_TEXT);
}

/** */
function createSelectionCard(e, outputText) {
var hostApp = e['docs'];
var builder = CardService.newCardBuilder();

  //Console section
  var console = CardService.newCardSection()
    .addWidget(CardService.newTextInput()
      .setFieldName('console')
      .setValue(outputText)
      .setMultiline(true));
  
  //Buttons section
  var buttons = CardService.newCardSection()
    .addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText('Run')
        .setOnClickAction(CardService.newAction().setFunctionName('tagStatements'))
        .setDisabled(false))
      .addButton(CardService.newTextButton()
        .setText('Clean')
        .setOnClickAction(CardService.newAction().setFunctionName('cleanDoc'))
        .setDisabled(false))
      .addButton(CardService.newTextButton()
        .setText('Export preview')
        .setOnClickAction(CardService.newAction().setFunctionName('preview'))
        .setDisabled(false)));

  var help = buttons.addWidget(CardService.newTextParagraph()
      .setText(`Position the cursor at the end of a statement, and click 'RUN'`))

  builder.addSection(console);
  builder.addSection(buttons);
  
  return builder.build();

};

/** */
function preview(e) {
  const doc = DocumentApp.getActiveDocument();
  const folders = DriveApp.getFileById(doc.getId()).getParents();

  Logger.log(folders);

  var folder = new Array();
  while (folders.hasNext()) {var f = folders.next(); folder.push(f.getId());} 

  Logger.log(folder);

  const url = "https://docs.google.com/document/d/" + doc.getId() + "/export" +
    "?format=pdf&" + "embedded=true";
    /* +
    "size=letter&" +
    "portrait=true&" +
    "scale=4&" +
    "top_margin=0&" +
    "bottom_margin=0&" +
    "left_margin=0&" +
    "right_margin=0&";*/

  const params = { method: "GET", headers: { "authorization": "Bearer " + ScriptApp.getOAuthToken() } };
  const filename = doc.getName().match(/(?<=\_)[\w\W]+/gi)[0];
  const blob = UrlFetchApp.fetch(url, params).getBlob().setName(`${filename}_preview`);
  
  DriveApp.getFolderById(folder[0]).createFile(blob);

}

/** */
function tagStatements(e) {
  const doc = DocumentApp.getActiveDocument();
  let numChildren = doc.getBody().getNumChildren();
  const docBody = doc.getBody();
  const cursor = doc.getCursor();
  
  try {
    const surroundingText = cursor.getSurroundingText().getText();
    const surroundingTextOffset = cursor.getSurroundingTextOffset();
    
    const stmt_open = surroundingText.match(/(\<){2}[\w\s\d]+(?=\{{2})/gi);
    const stmt_close = surroundingText.match(/(?<=\s)[\>]{2}/gi);
    const stmt_vars = surroundingText.match(/(\{){2}[\w\d]+(\}){2}/gi);
    const stmt_log = surroundingText.match(/[\&\!]{2}/gi);
    const stmt_alttxt = surroundingText.match(/(?<=\:\s)[\w\d\s\Wéèëêàäâùûô]+(?=\s+\>{2})/gi);

    //Logger.log( cursor.getSurroundingText().editAsText().findText(stmt_alttxt[0]) );

    let stmt_eval = '';
    
    if (stmt_log!=null) {
      let start_index = cursor.getSurroundingText().editAsText().findText(stmt_log[0]).getStartOffset();
      let end_index = cursor.getSurroundingText().editAsText().findText(stmt_log[0]).getEndOffsetInclusive();
      cursor.getSurroundingText().editAsText().setForegroundColor(start_index, end_index, '#bd1bde');
    };

    if (stmt_alttxt!=null) {
      //let start_index = cursor.getSurroundingText().editAsText().findText(stmt_alttxt[0]).getStartOffset();
      //let end_index = cursor.getSurroundingText().editAsText().findText(stmt_alttxt[0]).getEndOffsetInclusive();
      //cursor.getSurroundingText().editAsText().setForegroundColor(start_index, start_index+1, '#bd1bde');
      };

    if (stmt_open!=null) {
      cursor.getSurroundingText().editAsText().setForegroundColor(0,  stmt_open[0].length-1, '#bd1bde');
    } else {stmt_eval = 'invalid operator'};

    if (stmt_close!=null) {
      cursor.getSurroundingText().editAsText().setForegroundColor(surroundingText.length-3, surroundingText.length-1, '#bd1bde');
    } else {stmt_eval = "statement missing '>>'"};
    
    if (stmt_vars!=null) {
      for (var i=0;i<stmt_vars.length;i++){
        let start_index = cursor.getSurroundingText().editAsText().findText(stmt_vars[i]).getStartOffset();
        let end_index = cursor.getSurroundingText().editAsText().findText(stmt_vars[i]).getEndOffsetInclusive();
        cursor.getSurroundingText().editAsText().setForegroundColor(start_index, end_index, '#1b70cc');
      } 
    } else {stmt_eval = '{{VAR}} syntax invalid'};;
    
    if ((stmt_open!=null && stmt_close!=null) || stmt_vars!=null ) {stmt_eval = `${stmt_open} >> statement OK`};
    let res = `${stmt_eval}`;
    return createSelectionCard(e, res);
  } catch {createSelectionCard(e, 'error');}
  
};

/** */
function cleanDoc(e) {
  const doc = DocumentApp.getActiveDocument();
  const docBody = doc.getBody();
  docBody.editAsText().setForegroundColor(0,docBody.getText().length-1,'#000000');
  
}


