var INTERVAL = 80;
var ACTIVATION_THRESHOLD = 0;
var CONVERGE_NODES = 5;

function Hopfield(nodeCount) {
    this._weights = [];
    this.num_iter = INTERVAL;
    this._values = [];
    this.threshold = ACTIVATION_THRESHOLD;
    this.numNeurons = nodeCount;
    this.patterns = [];
    this.number_of_stored_patterns = 0;
    for (var i = 0; i < nodeCount; ++i) {
      this._weights[i] = [];
      this._values[i] = -1;
      for (var j = 0; j < nodeCount; ++j) {
        this._weights[i][j] = 1;
      }
    }
  }
  
  Hopfield.prototype.train = function(samples, method) {
    this.patterns[this.patterns.length] = samples;
    if (method == "1") {
        this._resetWeights();
        var nodeCount = this._values.length;
        for (var i = 0; i < nodeCount; ++i) {
          for (var j = 0; j < nodeCount; ++j) {
            for (var k = 0, len = samples.length; k < len; ++k) {
              if (samples[k][i] === samples[k][j]) {
                this._weights[i][j] += 1 / len;
              } else {
                this._weights[i][j] -= 1 / len;
              }
            }
          }
        }
    }
    
  }

  Hopfield.prototype.update_weights = function(samples) {
    this._resetWeights();
    // initialize weights
let _weights = Array.from({ length: this.numNeurons }, () =>
Array.from({ length: this.numNeurons }, () => 0)
);
let rho =
samples.reduce((acc, t) => acc + t.reduce((a, b) => a + b, 0), 0) /
(samples.length * this.numNeurons);

// Hebb rule
for (let i = 0; i < samples.length; i++) {
let t = samples[i].map((x) => x - rho);
for (let j = 0; j < this.numNeurons; j++) {
  for (let k = 0; k < this.numNeurons; k++) {
    _weights[j][k] += t[j] * t[k];
  }
}
}

// Make diagonal element of W into 0
for (let i = 0; i < this.numNeurons; i++) {
_weights[i][i] = 0;
}

_weights = _weights.map((row) => row.map((x) => x / samples.length));

this._weights = _weights;

  };
  Hopfield.prototype.one_iteration = function(Xs) {
    let Xs_ = new Array(this.numNeurons).fill(0);
  
    for (let i = 0; i < this.numNeurons; i++) {
      let activation = 0;
      for (let j = 0; j < this.numNeurons; j++) {
        activation += this._weights[i][j] * Xs[j];
      }
      Xs_[i] = activation >= 0 ? 1 : -1;
    }
  
    return Xs_;
  }
  Hopfield.prototype._resetWeights = function() {
    var nodeCount = this._values.length;
    for (var i = 0; i < nodeCount; ++i) {
      for (var j = 0; j < nodeCount; ++j) {
        this._weights[i][j] = 0;
      }
    }
  };
  Hopfield.prototype.learn = function(patterns) {
    const n = patterns[0].length;
    const weights = new Array(n * n).fill(0);

    for (let pattern of patterns) {
        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                if (i !== j) {
                    weights[i * n + j] += pattern[i] * pattern[j];
                    weights[j * n + i] = weights[i * n + j];
                }
            }
        }
    }

    this._weights = weights;
};
  Hopfield.prototype.Hebbian_Rule = function(patterns) {
    let N = this.patterns.length;
    for (let k = 0; k < N; k++) {
        for (let i = 0; i<this.numNeurons; i++) {
          for (let j = 0; j<this.numNeurons; j++) {
              this._weights[i][j] = patterns[k][i] * patterns[k][j] / N
          }
        }
    }
  };

  Hopfield.prototype.Activation = function(array) {
    let outputPattern = new Array(this.numNeurons).fill(0);
    for (let i = 0; i < array.length; i++) {
        outputPattern[i] = activation >= 0 ? 1 : -1;
    }
    return outputPattern;
  };

  
  Hopfield.prototype.classify = function(pattern) {
    for (let i = 0; i<this.num_iter; i++) {
        pattern =  this.one_iteration(pattern);
    }
    return pattern;
  };

  // Helper function to compare two arrays element by element
  function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
  }

  Hopfield.prototype.energy = function(s) {
    return -0.5 * dotProduct(s, dotProduct(this._weights, s)) + sum(dotProduct(s, this.threshold));
  };
  
  function dotProduct(W, y) {
    let activation = new Array(this.numNeurons).fill(0);
  
    for (let i = 0; i < this.numNeurons; i++) {
        activation[i] = 0;
        for (let j = 0; j < this.numNeurons; j++) {
            activation[i] += W[i][j] * y[j];}
        }
    return activation;
  };
  
  function sum(arr) {
    return arr.reduce((acc, val) => acc + val, 0);
  };
  
  
  Hopfield.prototype._run = function(init_s) {
    // Compute initial state energy
    let s = init_s;
    let e = this.energy(s);

    // Iteration
    for (let i = 0; i < this.num_iter; i++) {
        // Update s
        
        s = this.one_iteration(s);
        // Compute new state energy
        let e_new = this.energy(s);

        // s is converged
        if (e === e_new) {
            return s;
        }

        // Update energy
        e = e_new;
    }

    return s;
};


