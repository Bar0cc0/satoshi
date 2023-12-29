
function submit_request_smtp() {
    const submit = document.getElementById('wpforms-form-737');

    submit.addEventListener('submit',(e)=>{
        const fname = document.getElementById("wpforms-737-field_0-fname").value;
        const lname = document.getElementById("wpforms-737-field_0-lname").value;
        const mail = document.getElementById("wpforms-737-field_1_email").value;
        const req = document.getElementById("wpforms-737-field_2-request").value;
        const msg = document.getElementById("wpforms-737-field_3-msg").value;
        var body = fname+"\n"+lname+"\n"+mail+"\n"+msg;
        e.preventDefault();
        
        Email.send({
            Host : "smtp.elasticemail.com",
            Username : "michaelgarancher1@gmail.com",
            Password : "BD5BC11F033DBE938C23606935D8ACAFD848",
            To : "michaelgarancher1@gmail.com",
            From : "michaelgarancher1@gmail.com",
            Subject : String(req),
            Body : String(body)
        }).then(
            message => console.log("smtp "+message+"\n"+body )
        );
    });

}

submit_request_smtp()
