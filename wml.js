// Main entry point when the user clicks compile
function compile() {
    var inArea = document.getElementById('idtextarea');
    var outDiv = document.getElementById('iddiv');
    var inText;
    // get input text
    if (inArea.value) inText=inArea.value;
    else inText = inArea.innerHTML;

    setDebugText(inText);

    // parse and return the output
    var outText;
    try {
         outText = evalWML(parseOuter(inText),createEnv(null));
    } catch(e) {
        outText = '<span style="color:red;">'+e+'</span>';
    }

    // display result, letting the browser interpret it as HTML
    outDiv.innerHTML = outText;
}

// These two functions are for your use, to display debug information.

// Clear existing debug text and display s
function setDebugText(s) {
    var dbgDiv = document.getElementById('iddebug');
	while (dbgDiv.firstChild) 
		dbgDiv.removeChild(dbgDiv.firstChild);
    addDebugText(s);
}

// Append s to existing debug text
function addDebugText(s) {
    var dbgDiv = document.getElementById('iddebug');
	var outNL = s.split(/\n/);
	for (var i=0;i<outNL.length;i++) {
		dbgDiv.appendChild(document.createTextNode(outNL[i]));
		dbgDiv.appendChild(document.createElement('br'));
	}
}
