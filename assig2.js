// These tokens are trivial, made of the literal characters we want to recognize, and ensuring it is at
// the start of the string.
var TSTART = /^{{/;
var TEND = /^}}/;
var DSTART = /^{:/;
var DEND = /^:}/;
var PSTART = /^{{{/;
var PEND = /^}}}/;
// Pipe is a bit trickier, since "|" is a special character in RegExp's, so we need to escape it.
var PIPE = /^\|/;

// These rest rely on the same idea.  We match at least 1 character, consisting of a choice between
// something that could not be any of the disallowed tokens, or which is part of a disallowed
// token, but not followed by the rest of it.  For this we make use of the "x(?!y)" operator.

// For PNAME, we can recognize anything but "}", or "}" not followed by another "}", or "}}"
// not followed by another "}".
var PNAME = /^([^}|]|}(?!})|}}(?!}))+/;

// OUTERTEXT recognizes anything but "{", or "{" not followed by either of "{" or ":"
var OUTERTEXT = /^([^{]|{(?!({|:)))+/;

// INNERTEXT recognizes anything but "{" or "|", or "}", or "{" not followed by "{" or ":",
// or "}" not followed by another "}"
var INNERTEXT = /^([^{|}]|{(?!({|:))|}(?!}))+/;

// INNERDTEXT recognizes anything but "{" or "|", or ":", or "{" not followed by "{" or ":",
// or ":" not followed by "}"
var INNERDTEXT = /^([^{|:]|{(?!({|:))|:(?!}))+/;

// Returns the token located at the beginning of s, where the set of allowed tokens
// is given by an object tokenset, as per the assignment format.
// Syntactically correct input is assumed, and the tokenset is assumed appropriate
// for the input too, so we do not need to check for errors of any form.
function scan(s,tokenset) {
    // Inside here we just need to check for each regexp we defined in q1.
    // Tokens are disjoint in all valid cases, except for TSTART and PSTART,
    // which we resolve by always checking for PSTART first.

    // just for debugging
    // var ss = "{ ";
    // for (var t in tokenset) {
    //     ss += t + ": "+tokenset[t]+", ";
    // }
    // addDebugText("Token set: "+ss+"}\n");

    // To go over all tokens we create an array of objects mapping names to the 
    // corresponding regexp variables we created in q1.  We use an array
    // so we can check them in a specific order.
    var tokens = [
        { name:"PSTART", regexp:PSTART },
        { name:"PEND", regexp:PEND },
        { name:"TSTART", regexp:TSTART }, 
        { name:"TEND", regexp:TEND } ,
        { name:"DSTART", regexp:DSTART },
        { name:"DEND", regexp:DEND },
        { name:"PIPE", regexp:PIPE },
        { name:"PNAME", regexp:PNAME },
        { name:"OUTERTEXT", regexp:OUTERTEXT },
        { name:"INNERTEXT", regexp:INNERTEXT },
        { name:"INNERDTEXT", regexp:INNERDTEXT } ];

    // Now, iterative through our tokens array, and see what we find
    for (var i=0; i<tokens.length; i++) {
        var m;
        if (tokenset[tokens[i].name] && (m = s.match(tokens[i].regexp))) {
            return { token:tokens[i].name, value:m[0] };
        }
    }
    throw "Hey, there aren't supposed to be syntactic errors, but I encountered \""+s+"\"";
}

// Parsing the <outer> rule.
function parseOuter(s) {
    // As a base case, if we are fed the empty string just return null.
    if (s=="")
        return null;

    // Find out which of the 3 tokens we know about are at the start of the string.
    var t = scan(s,{OUTERTEXT:true,TSTART:true,DSTART:true});

    // Make up the object we will return; we modify fields below.
    var obj = {name:"outer",
               OUTERTEXT:null,
               templateinvocation:null,
               templatedef:null,
               next:null,
               // We'll keep track of the length of s we consumed in this and all
               // recursive calls here too.
               length:0};

    // And construct the returned object for each of the 3 cases.
    switch (t.token) {
    case 'OUTERTEXT':
        obj.OUTERTEXT = t.value;
        // Skip over consumed token.
        obj.length += t.value.length;
        s = s.substr(obj.length);
        break;
    case 'TSTART':
        obj.templateinvocation = parseTemplateInvocation(s);
        // Update how far we got in through the string.
        obj.length += obj.templateinvocation.length;
        s = s.substr(obj.templateinvocation.length);
        break;
    case 'DSTART':
        obj.templatedef = parseTemplateDef(s);
        // Update how far we got in through the string.
        obj.length += obj.templatedef.length;
        s = s.substr(obj.templatedef.length);
        break;
    }
    // We might have more outer pieces, so keep going.
    obj.next = parseOuter(s);
    // Update length to include everything we consumed.
    if (obj.next!==null)
        obj.length += obj.next.length;
    return obj;
}

// Parsing the <templateinvocation> rule. We assume the inital TSTART is at the front of the string.
function parseTemplateInvocation(s) {
    // Make up the object we will return; we modify fields below.
    var obj = {name:"templateinvocation",
               itext:null,
               targs:null,
               length:0};

    // First we need to skip over the initial token, which must be a TSTART.
    var t = scan(s,{TSTART:true});
    obj.length = t.value.length;
    // And skip over consumed token.
    s = s.substr(obj.length);

    // Next we find the name.  This is an itext, which is a list, and so might be empty.
    obj.itext = parseItext(s);
    if (obj.itext!=null) {
        obj.length += obj.itext.length;
        s = s.substr(obj.itext.length);
        // Strip WS.
        obj.itext = pruneWS(obj.itext,"INNERTEXT");
    }

    // Then parse through the argument list.  Again, this is a list, and it might be empty.
    obj.targs = parseTargs(s);
    if (obj.targs!=null) {
        obj.length += obj.targs.length;
        s = s.substr(obj.targs.length);
    }

    // Finally, we must end with a TEND, so this is guaranteed to exist.
    var t = scan(s,{TEND:true});
    obj.length += t.value.length;
    return obj;
}

// Remove leading and trailing whitespace from our lists.
// Not strictly necessary, as we have to prune it once we evaluate it again anyway,
// but since it was asked for in the assignment here it is.
// The field parameter should be INNERTEXT, or INNERDTEXT as necessary.
function pruneWS(list,field) {
    // Note that we assume our 
    function pruneLeading(list,field) {
        if (list!=null && list[field]!==null) {
            list[field] = list[field].replace(/^\s+/,'');
        }
        return list;
    }
    function pruneTrailing(inlist,field) {
        var list = inlist;
        while (list!=null && list.next!=null) 
            list = list.next;
        if (list!=null && list[field]!==null) {
            list[field] = list[field].replace(/\s+$/,'');
        }
        return inlist;
    }
    return pruneTrailing(pruneLeading(list,field),field);
}

// Parsing itext.  This returns a linked list of objects, possibly null.
function parseItext(s) {
    // An empty string could be a base case.  Strictly speaking, however, parsing <itext> 
    // should never actually terminate in anything other than a PIPE or a TEND, so this
    // is just being over-cautious.
    if (s=="")
        return null;

    // See which token is at the start of the string.
    var t = scan(s,{INNERTEXT:true,TSTART:true,DSTART:true,PSTART:true,PIPE:true,TEND:true});

    // If we scanned PIPE or TEND, then we are done, at a base case.
    if (t.token=="PIPE" || t.token=="TEND")
        return null;

    // Otherwise, we have a legitimate itext rule expansion, as INNERTEXT, an invoc, def, or param.
    var obj = {name:"itext",
               INNERTEXT:null,
               templateinvocation:null,
               templatedef:null,
               tparam:null,
               next:null,
               length:0};

    // And now build the object to be returned.
    switch (t.token) {
    case 'INNERTEXT':
        obj.INNERTEXT = t.value;
        // Skip over consumed token.
        obj.length += t.value.length;
        s = s.substr(obj.length);
        break;
    case 'TSTART':
        obj.templateinvocation = parseTemplateInvocation(s);
        // Update how far we got in through the string.
        obj.length += obj.templateinvocation.length;
        s = s.substr(obj.templateinvocation.length);
        break;
    case 'DSTART':
        obj.templatedef = parseTemplateDef(s);
        // Update how far we got in through the string.
        obj.length += obj.templatedef.length;
        s = s.substr(obj.templatedef.length);
        break;
    case 'PSTART':
        obj.tparam = parseTParam(s);
        // Update how far we got in through the string.
        obj.length += obj.tparam.length;
        s = s.substr(obj.tparam.length);
        break;
    }

    // We might have more pieces to the itext list, so keep going.
    obj.next = parseItext(s);
    // Update length consumed to include the remaining pieces too
    if (obj.next!==null)
        obj.length += obj.next.length;
    return obj;
}

// Parsing targs.  This is another list.
function parseTargs(s) {
    // To start with we should see a PIPE or a TEND.  If we see TEND, then
    // we are done with our list.
    var t = scan(s,{PIPE:true,TEND:true});
    if (t.token=='TEND') 
        return null;

    // Ok, we saw a PIPE, so we know we have an argument (and maybe more).

    var obj = {name:"targs",
               itext:null,
               next:null,
               length:t.value.length};

    // Skip over the PIPE.
    s = s.substr(obj.length);

    // Parse the ensuing itext.
    obj.itext = parseItext(s);
    if (obj.itext!=null) {
        obj.length += obj.itext.length;
        s = s.substr(obj.itext.length);
        obj.itext = pruneWS(obj.itext,"INNERTEXT");
    }

    // There might be more arguments, so keep parsing recursively.
    obj.next = parseTargs(s);
    if (obj.next!=null)
        obj.length += obj.next.length;
    return obj;
}

// Parsing <templatedef>.  Very much like parsing an invocation, we get here once we've
// already recognized the DSTART, so we know it starts with one.
function parseTemplateDef(s) {
    var obj = {name:"templatedef",
               // It's all one big list of dtext, but it's a bit easier if we at least split
               // off the name from the rest of it.
               dtext:null,
               dparams:null,
               length:0};

    // First we need to skip over the initial token, which must be a DSTART.
    var t = scan(s,{DSTART:true});
    obj.length = t.value.length;
    // And skip over consumed token.
    s = s.substr(obj.length);

    // Next we find the template name.  This is a dtext.
    obj.dtext = parseDtext(s);
    if (obj.dtext!=null) {
        obj.length += obj.dtext.length;
        s = s.substr(obj.dtext.length);
        // Strip WS.
        obj.dtext = pruneWS(obj.dtext,"INNERDTEXT");
    }

    // Then the parameter list.
    obj.dparams = parseDparams(s);
    // The dparams list cannot be null, as we always have a body.
    obj.length += obj.dparams.length;
    s = s.substr(obj.dparams.length);

    // Clean off any leading/trailing ws from the args, but not the body.
    var d = obj.dparams;
    while(d.next!=null) {
        d.dtext = pruneWS(d.dtext,"INNERDTEXT");
        d = d.next;
    }

    // Finally, we must end with a DEND, so this is guaranteed to exist.
    var t = scan(s,{DEND:true});
    obj.length += t.value.length;
    return obj;
}

// Parsing dtext.  This is quite similar to parseItext, just terminating
// in a DEND instead of TEND, and including INNERDTEXT instead of INNERTEXT.
function parseDtext(s) {
    // Trivial base case check.
    if (s=="")
        return null;

    // See which token is at the start of the string.
    var t = scan(s,{INNERDTEXT:true,TSTART:true,DSTART:true,PSTART:true,PIPE:true,DEND:true});

    // If we scanned PIPE or DEND, then we are done, at a base case.
    if (t.token=="PIPE" || t.token=="DEND")
        return null;

    // Otherwise, we have a legitimate dtext rule expansion, as INNERDTEXT, an invoc, def, or param.
    var obj = {name:"dtext",
               INNERDTEXT:null,
               templateinvocation:null,
               templatedef:null,
               tparam:null,
               next:null,
               length:0};

    // And now build the object to be returned.
    switch (t.token) {
    case 'INNERDTEXT':
        obj.INNERDTEXT = t.value;
        obj.length += t.value.length;
        // Skip over consumed token.
        s = s.substr(obj.length);
        break;
    case 'TSTART':
        obj.templateinvocation = parseTemplateInvocation(s);
        // Update how far we got in through the string.
        obj.length += obj.templateinvocation.length;
        s = s.substr(obj.templateinvocation.length);
        break;
    case 'DSTART':
        obj.templatedef = parseTemplateDef(s);
        // Update how far we got in through the string.
        obj.length += obj.templatedef.length;
        s = s.substr(obj.templatedef.length);
        break;
    case 'PSTART':
        obj.tparam = parseTParam(s);
        // Update how far we got in through the string.
        obj.length += obj.tparam.length;
        s = s.substr(obj.tparam.length);
        break;
    }

    // We might have more pieces to the dtext list, so keep going.
    obj.next = parseDtext(s);
    // Update length consumed to include the remaining pieces too
    if (obj.next!==null)
        obj.length += obj.next.length;
    return obj;
}

// Parsing dparams.  This is another list, of parameters, and the body.
function parseDparams(s) {
    // To start with we should see a PIPE or a DEND.  If we see DEND, then
    // we are done with our list.
    var t = scan(s,{PIPE:true,DEND:true});
    if (t.token=='DEND') 
        return null;

    // Ok, we saw a PIPE, so we know we have an parameter (or body).
    var obj = {name:"dparams",
               dtext:null,
               next:null,
               length:t.value.length};

    // Skip over the PIPE.
    s = s.substr(obj.length);

    // Parse the ensuing dtext.
    obj.dtext = parseDtext(s);
    if (obj.dtext!=null) {
        obj.length += obj.dtext.length;
        s = s.substr(obj.dtext.length);
    }

    // There might be more, so keep parsing recursively.
    obj.next = parseDparams(s);
    if (obj.next!=null)
        obj.length += obj.next.length;
    return obj;
}

// Parsing a <tparam> structure.
function parseTParam(s) {
    // We get here having already seen the PSTART, so 
    // we just need to skip over that and get the name and the PEND.

    var obj = {name:"tparam",
               pname:null,
               length:0};

    // First we need to skip over the initial token, which must be a PSTART.
    var t = scan(s,{PSTART:true});
    obj.length = t.value.length;
    // And skip over consumed token.
    s = s.substr(obj.length);

    // Now scan the parameter name.
    t = scan(s,{PNAME:true});
    
    obj.pname = t.value.trim();
    obj.length += t.value.length;
    s = s.substr(t.value.length);

    // And the PEND.
    t = scan(s,{PEND:true});
    obj.length += t.value.length;
    return obj;
}

//  -----------------Helpers-------------------------

function printASTIndent(node, tabVal){
	if(typeof tabVal === 'undefined'){
		tabVal = 0;
	}
	var tabs = "";
	for(var i = 0; i < tabVal; i++){
		tabs= tabs.concat("	");
	}
	var result = "";
	for(var param in node){
		if (node.hasOwnProperty(param)){
			var curNode;
			if(typeof node[param] === 'object' && node[param] !== null){
				curNode ='\n' + printASTIndent(node[param], tabVal+1);
				result +=tabs + param +":" + curNode;

			}
			else{
				curNode = node[param];
				result +=tabs + param +":" + curNode + '\n';
			}
		}
	}
	return result;
}

//  -----------------Assignment start----------------

// parseOuter(s)

// Question 1
// Create environment
//  -Random unique name
//  -Envirnment bindings
//  -Parent environment object
/*
    { name: ,
    bindings: { ... },
    parent: }

    createEnv(parent)   which creates a new environment
    lookup(name,env)     which returns the first binding value for binding key name. This function
                        searches through the given environment and then parents, returning null if no binding is found
*/

/*
Binding closure template:
e = createEnv(parent)
return function{
    this can access e
}
*/

function createEnv(parent){
    if(parent == undefined){
        parent = null;
    }
    return {
        name: Math.floor((Math.random() * 1000000)+1),
        parent: parent,     //This is an env object
        bindings:  {}         //init an empty binding set
    }
}


function lookup(name,env){      //Done
    //check local env
    for(var sbinding in env.bindings){
        if (!sbinding.localeCompare(name)){
            return env.bindings[sbinding];
        }
    }
    //check parent
    if(env.parent == null || env.parent == undefined){
        console.log("not found in environment")
        return null;
    }
    return lookup(name,env.parent);
}

function evalWML(ast,env){
    
    //Create env if there is none
    if (env == null || env == undefined) {
        env = createEnv(env);   //If no environment was passed, create a new one
        console.log("Created new env");
    }
    //Here add #if #ifeq #expr to the env
    evalTemplateDef(parseOuter("{:#if|cond|thenpart|elsepart| :}").templatedef,env)
    evalTemplateDef(parseOuter("{:#ifeq|a|b|thenpart|elsepart| :}").templatedef,env)
    evalTemplateDef(parseOuter("{:#expr|exp| :}").templatedef,env)

    return evalOuter(ast,env);
}

function evalOuter(ast,env){
    if(ast == null){    //Return empty string if no more OUTERTEXT
        return "";
    }

    if(ast.templateinvocation != null){
        return evalTemplateInvoc(ast.templateinvocation,env) + evalOuter(ast.next,env);
        //eval a template invoc
    }else if(ast.templatedef != null){
        return evalTemplateDef(ast.templatedef,env) + evalOuter(ast.next,env);
        //eval a template def
    }else{  //Empty text
        return ast.OUTERTEXT + evalOuter(ast.next,env);
    }
}

function evalTemplateDef(ast,env){  //add binding {params[], body: ASTnode, env (where is was defined)}
    if(ast == null){
        return "";
    }
    //Evaluate the name, Evaluate all the params, Extract the body
    var params = [];
    function getBody(ast){  //Take a dparams node and return the dtext of the last linked dparams node
        if(ast == null){
            console.log("Error occured, no body found");
            return null;    //Error occured
        }
        if(ast.name == "dparams" && ast.next == null && ast.dtext != null){
            //we want the last dtext also
            function getdtext(dtext){
                if(dtext.templatedef!=null){
                    evalTemplateDef(dtext.templatedef,env);
                }
                if(dtext.next==null){
                    return dtext;
                }
                return getdtext(dtext.next);
            }
            return getdtext(ast.dtext);
        }else{
            return getBody(ast.next);
        }
    }
    function registerParams(ast){
        if(ast.next == null){
            return;     //This is the body, we dont want to register it
        }
        params.push(evalDefinitionText(ast.dtext,env)); //Evaluate the param and register it
        registerParams(ast.next)    //register next params
    }
    var funcname = evalDefinitionText(ast.dtext,env);   // Evaluate the name
    registerParams(ast.dparams);
   //add the function to parent env
    env.bindings[funcname] = {    //bind the function
        params: params,
        body: getBody(ast.dparams),
        env: env        //Return the environment passed, in which the function was defined
    }
         //Always return empty string
  return "";
}

function evalTemplateInvoc(ast, env) {
    if(ast == null){
        return "";
    }

    //Create a new environment
    var newenv = createEnv(env);
    //eval the name ->  String
    var invocname = evalInnerText(ast.itext);
    var argsarray = [];
 
    //eval each of the args an put the str in an array
    function registerArgs(ast){
        if(ast == null){
            return;
        }
        argsarray.push(evalInnerText(ast.itext,env)); //Evaluate the param and register it
        registerArgs(ast.next)    //register next params
    }
    registerArgs(ast.targs);
    //lookup the name in env
    var foundFunction = lookup(invocname,env);
    if (foundFunction == null){
        //console.log("\n"+invocname+" not found in environment");
        return;
    }
    // Find list of params and create bindings to args
    for (var i in foundFunction.params){   //For each param add a binding to it in the new environment
        if(argsarray.length == 0) {
            return
        }
        newenv.bindings[foundFunction.params[i]] = argsarray[i];   //.shift
    }
    //Catch pre-made function
    if(invocname.charAt(0)=='#'){
        if(invocname=="#if"){
            if(argsarray[0]==""){
                return argsarray[1];
            }else{
                return argsarray[2];
            }
        }else if(invocname=="#ifeq"){
            if(argsarray[0]==argsarray[1]){
                return argsarray[2];
            }else{
                return argsarray[3];
            }
        }else if(invocname=="#expr"){
            return eval(argsarray[0]);
        }
    }
    //Evaluate the body in the new environment
    return evalDefinitionText(foundFunction.body,newenv);
}
function evalTemplateArg(ast, env) {
    //Deprecated
    if(ast == null){
        return "";
    }
    //We should first evaluate the argument, then search in the env
    return lookup(evalInnerText(ast.itext,env)+evalTemplateArg(ast.next,env),env)
}
function evalInnerText(ast, env) {
    if(ast == null){
        return "";
    }

    if(ast.INNERTEXT != null){
        return ast.INNERTEXT + evalInnerText(ast.next,env);
    }else if (ast.templateinvocation != null){
        return evalTemplateInvoc(ast.templateinvocation,env) + evalInnerText(ast.next,env);
    }else if (ast.templatedef != null){
        return evalTemplateDef(ast.templatedef,env) + evalInnerText(ast.next,env);
    }else if (ast.tparm != null){
        return evalTemplateParam(ast.tparam,env) + evalInnerText(ast.next,env);
    }

    return "A string";
}
function evalDefinitionText(ast, env) {
    if(ast == null){
        return "";
    }

    if (ast.INNERDTEXT != null) {
        return ast.INNERDTEXT + evalDefinitionText(ast.next, env);      //There is plain text only so we can return it
    } else if (ast.templateinvocation != null) {
        return evalTemplateInvoc(ast.templateinvocation,env) + evalDefinitionText(ast.next, env);
    } else if (ast.templatedef != null) {
        return eval(ast.templatedef,env) + evalDefinitionText(ast.next, env);
    } else if (ast.tparam != null) {
        return evalTemplateParam(ast.tparam,env) + evalDefinitionText(ast.next, env);
    }

    return "A string";
}
function evalDefinitionParam(ast, env) {
    if(ast == null){
        return "";
    }

    //only possibility is dtext
    return evalDefinitionText(ast.dtext,env) + evalDefinitionParam(ast.next,env);
}
function evalTemplateParam(ast, env) {  //The function that call it should contain the param binding
    if(ast == null){
        return "";
    }

    return lookup(ast.pname,env);   //Lookup the param in the env
}

var classtest = "{:foo|x|{:funcOne|{{{x}}}:}{:funcTwo|x|{{funcOne}}:}{{funcTwo|dynamic}}:}{{foo|static}}"
//var classtest = "{:fct | arg :}"
var classast = parseOuter(classtest);
console.log("Input string: "+classtest);
console.log(printASTIndent(classast));
var t = evalWML(classast);
console.log(t);

