/*
Anthony Courchesne
260688650
14 November 2016

COMMENTS:
This contains the procedure to use Church Numerals with my code.
*/

var env = createEnv(null);
//define premade function in case we need them before they are usually defined (My code defines them later)
evalTemplateDef(parseOuter("{:#if|cond|thenpart|elsepart| :}").templatedef,env);        //
evalTemplateDef(parseOuter("{:#ifeq|a|b|thenpart|elsepart| :}").templatedef,env);       //This is copy-paste from original code
evalTemplateDef(parseOuter("{:#expr|exp| :}").templatedef,env);                         //
//first define functions
//makeN evaluate n: if n==0, return X, else return a closure of makeN(n-1)
evalTemplateDef(parseOuter("{:makeN|n| {{#ifeq|{{{n}}}|0|{{{x}}}|{:`|x|{{makeN| {{#expr|{{{n}}}-1 }} }}:} }} :}").templatedef,env); //makeN
evalTemplateDef(parseOuter("{:succ|n|{{makeN|{{#expr|{{{n}}}+1}} }}:}").templatedef,env); //Successor function
evalTemplateDef(parseOuter("{:iszero|n|{{#ifeq|{{makeN|n}}|{{{x}}}||false}}:}").templatedef,env); //isZero return empty string if true
evalTemplateDef(parseOuter("{:plus|n|m|{{n| {{succ|{{{m}}} }} }} :}").templatedef,env); //plus
//prefixSum(number,sum)
evalTemplateDef(parseOuter("{:prefixSum|n|s|{{#if|{{iszero|{{makeN|n}} }}|{{{s}}}|{{prefixSum|{{#expr|{{{n}}}-1}}|{{plus|{{{s}}}|{{{n}}} }} }} }}:}").templatedef,env);
evalOuter(parseOuter("{{prefixSum|5|0}}"))  //Example to calculate prefix sum of 5