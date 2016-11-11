function test1(){
    var y=3;
    function test2(){
        return y;
    }
    console.log(test2());
    y = 43;
    console.log(test2());
}
test1();