function test1(){

    var env = {
        bindings:"",
        count:0
    };
    test2(env);
    return env;
    
}
function test2(env){
    env.bindings="assign";
}
function createEnv(parent){
    return {
        name: Math.floor((Math.random() * 1000000)+1),
        parent: parent,     //This is an env object
        bindings:  {}         //init an empty binding set
    }
}

console.log(test1());