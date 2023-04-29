function outer_product(X) {
    // X is supposed to be an array of length d
    // the function returns the dot product of X and X transpose
    var result = 0;
    for (var i = 0; i<X.length; i++) {
        result += X[i] * X[i];
    }
    return result;
}