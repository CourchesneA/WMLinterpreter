// Construct a random tree based on pairs constructed using cons.
// Branches are deepened with probability p.
// Returns an object, with a "tree" field containing the random tree,
// and a "target" field containing a randomly selected, unique name
// within the tree.
function rndTree(p) {
    // Keep track of all names used, so we can ensure they are unique,
    // and also find a random name later too.
    var allNames = [];
    // The number of characters in a random string.
    var nameLength = 5;

    // Returns a random integer 0..max-1.
    function rndInt(max) {
        return Math.floor(Math.random() * max);
    }

    // Constructs a random string, as a tree element.
    function rndString() {
        // The set of characters from which the random name will be derived.
        var alphas = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        // A recursive helper to progressively append n chars onto s.
        function helper(n,s) {
            if (n==0)
                return s;
            return helper(n-1,s + alphas.charAt(rndInt(alphas.length)));
        }
        var name = helper(nameLength,'');
        // Here we ensure the name just constructed is unique within the tree,
        // and if not we try again recursively.
        if (allNames.indexOf(name)>=0)
            return rndString();
        // Ok, unique, so record the name.
        allNames.push(name);
        return name;
    }

    // This function actually constructs the random tree, recursively deepening either the 
    // first or second of the pair with probability p.
    function rndTreeHelper(p) {
        return cons(
            (Math.random()<p) ? rndTreeHelper(Math.max(0,p-0.01)) : rndString(),
            (Math.random()<p) ? rndTreeHelper(Math.max(0,p-0.01)) : null);
    }
    
    var t = rndTreeHelper(p);

    return { target: allNames[rndInt(allNames.length)],
             tree: t };
}

// Example usage.
// 0.6 tend to work well, producing a variable but mostly reasonably sized tree.
var t = rndTree(0.6);
show(t.tree)+"\n"+t.target;
