/*
Anthony Courchesne
260688650
14 November 2016
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


function lookup(name,env){
    //check local env
    for(var sbinding in env.bindings){
        if (!sbinding.localeCompare(name)){
            return env.bindings[sbinding];
        }
    }
    //check parent
    if(env.parent == null || env.parent == undefined){
        //console.log("DEBUG: not found in environment")
        return null;
    }
    return lookup(name,env.parent);
}