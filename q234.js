/*
Anthony Courchesne
260688650
14 November 2016

COMMENTS:
Contain question 2,3,4 since they were modifications of the same code and should really be only one program.
This code has successfully passed all the test cases submitted by Theo (file included)
Test code is included (Commented out) at the end of this file
*/

function evalWML(ast,env){
    
    //Create env if there is none
    if (env == null || env == undefined) {
        env = createEnv(env);   //If no environment was passed, create a new one
        //console.log("DEBUG: Created new env");
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

function evalTemplateDef(ast,env){ 

    if(ast == null){
        return "";
    }
    //Evaluate the name, Evaluate all the params, Extract the body
    var params = [];
    function getBody(ast){  //Take a dparams node and return the dtext of the last linked dparams node
        if(ast == null){
            console.log("ERROR, no body found");
            return null;    //Error occured
        }
        if(ast.name == "dparams" && ast.next == null && ast.dtext != null){
            return ast.dtext;
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
    //create the function object
    var funcobj ={    //bind the function
        params: params,
        body: getBody(ast.dparams),
        env: env        //Return the environment passed, in which the function was defined
    }

    //Here handle Closure (Question 4)
    if(funcname.charAt(0)=='`'){
        if(funcname.length == 1){
            //dont add bindings, only return closure
            return stringify(funcobj);
        }else{
            funcname = funcname.substr(1);      //remove the backtick in the name
            env.bindings[funcname] = funcobj;
            return stringify(funcobj);
        }
    }
    //add the function to parent env
    env.bindings[funcname] = funcobj;

  return "";
}

function evalTemplateInvoc(ast, env) {
    if(ast == null){
        return "";
    }

    //Create a new environment
    var newenv = createEnv(env);
    //eval the name ->  String
    var invocname = evalInnerText(ast.itext,env);
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
    //Here handle closure string for q4:    If it is a closure then unstringify to get a function, else lookup the function
    if(invocname.charAt(0) == '{' && invocname.charAt(invocname.length-1) == '}'){
        var foundFunction = unstringify(invocname);
    }else{
        //lookup the name in env
        var foundFunction = lookup(invocname,env);
    }
    
    if (foundFunction == null){
        console.log("ERROR: function \""+invocname+"\" not found in environment");
        return;
    }
    // Find list of params and create bindings to args
    for (var i in foundFunction.params){   //For each param add a binding to it in the new environment
        if(argsarray.length == 0) {
            return
        }
        newenv.bindings[foundFunction.params[i]] = argsarray[i];
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
    }else if (ast.tparam != null){
        return evalTemplateParam(ast.tparam,env) + evalInnerText(ast.next,env);
    }

    return "Error1";
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
        return evalTemplateDef(ast.templatedef,env) + evalDefinitionText(ast.next, env);
    } else if (ast.tparam != null) {
        return evalTemplateParam(ast.tparam,env) + evalDefinitionText(ast.next, env);
    }

    return "Error2";
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

/*
var classtest = "{:greaterThan|x|y|{{#ifeq|{{#expr|{{{x}}}>{{{y}}} }}|true|{{{x}}}|{{{y}}} }}:}{:square|x|{:mult|x|y|{{#expr|{{{x}}}*{{{y}}} }}:}{{mult|{{{x}}}|{{{x}}} }}:}{:squareOfGreater|x|z|{{square|{{greaterThan|{{{x}}}|{{{z}}} }} }}:}The square of the greater of these two numbers (4 and 10) is: {{squareOfGreater|4|10}}"
var classast = parseOuter(classtest);
console.log("Input string: "+classtest);
var t = evalWML(classast);
console.log(t);
*/