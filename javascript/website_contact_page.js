/* Add to contact.html 
// Header section
    <script src="https://smtpjs.com/v3/smtp.js"></script>
// Body section, after </form>
    <script src="./smtp_post_request.js"></script>
*/

// Get rtype from config.json
var requestType = [
    "Service_0 - Information générale",
    "Service_1 - Politique de confidentialité",
];

window.onload = function() {
    var requestSelect = document.getElementById("wpforms-737-field_2-request");
    for (let x = 0; x < requestType.length; x++) {
        console.log(requestType[x]);
        requestSelect.options[requestSelect.options.length] = new Option(requestType[x],requestType[x]);
    }
}
