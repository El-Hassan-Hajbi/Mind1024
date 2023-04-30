document.addEventListener('DOMContentLoaded', function() {
(function() {
  var NUMBER_OF_DIGITS = 3;
  function f(vector) {
    var res = [];
    for (var element of vector) {
      if (element == 0) {
          res[res.length] = -1;
      }
      else {
        res[res.length] = 1;
      }
    }
    return res;
  }

  function prepare_data(dataset){
    var res= [];
    for (var i = 0; i< dataset.length; i++) {
      res[i] = [];
      var ith = dataset[i].input;
      for (var j = 0; j< ith.length; j++) {
        if (ith[j] == 0) {res[i][j] = -1;}
        else {res[i][j] = 1;}
      }
    }
    return res;
  }
  
  const jsonFiles = [
    '../digits/0.json',
    '../digits/1.json',
    '../digits/2.json',
    '../digits/3.json',
    '../digits/4.json',
    '../digits/5.json',
    '../digits/6.json',
    '../digits/7.json',
    '../digits/8.json',
    '../digits/9.json'
  ];
  
  // MNIST digits
  var MNIST = [];
  var raw = [];
  // size of the sample images (28 x 28)
  var size = 28;
  
  async function loadJsonFiles() {
    for (const file of jsonFiles) {
      const response = await fetch(file);
      const json = await response.json();
      raw.push(json.data);
    }
  }
  
  loadJsonFiles().then(() => {
    Array.from({length: NUMBER_OF_DIGITS}, (_, i) => i).forEach(function (id) {
      // mnist digit
      var digit = {
        id: id
      };
    
      // raw data
      digit.raw = raw[digit.id];
    
      // number of samples
      digit.length = digit.raw.length / (size * size) | 0;
    
      // get one sample
      digit.get = function (_which) {
        var which = _which;
        // if not specified, or if invalid, pick a random sample
        if ('undefined' == typeof which || which > digit.length || which < 0) {
          which = Math.random() * digit.length | 0;
        }
    
        // generate sample
        var sample = [];
        for (
          var length = size * size,
          start = which * length,
          i = 0;
          i < length;
          sample.push(digit.raw[start + i++])
        );
        return sample;
      }
    
      // get a range of samples
      digit.range = function (start, end) {
        if (start < 0)
          start = 0;
        if (end >= digit.length)
          end = digit.length - 1;
        if (start > end) {
          var tmp = start;
          start = end;
          end = tmp;
        }
        var range = [];
        for (
          var i = start;
          i <= end;
          range.push(digit.get(i++))
        );
        return range;
      }
    
      // get set of digits, ready to be used for training or testing
      digit.set = function (start, end) {
        var set = [];
        var output = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        output[digit.id] = 1;
        var range = digit.range(start, end);
        for (
          var i = 0;
          i < range.length;
          set.push({
            input: range[i++],
            output: output
          })
        );
        return set;
      }
    
      // add mnist digit
      MNIST.push(digit);
    });
    
    // Generates non-overlaping training and a test sets, with the desired ammount of samples
    MNIST.get = function (count) {
      var range = [];
      for (var i in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        range = range.concat(this[i].set(0, this[i].length));
      }
      range = shuffle(range);
      if (Number(count)) {
        range = range.slice(0, Number(count));
      }
      return range;
    }
    
    
    // Generates non-overlaping training and a test sets, with the desired ammount of samples
    MNIST.set = function (_training, _test) {
      var training = _training / 10 | 0;
      var test = _test / 10 | 0;
    
      if (training < 1)
        training = 1;
      if (test < 1)
        test = 1;
    
      // check that there are enough samples to make the sets, and change the ammounts if they are too big
      if (training + test + 1 > MNIST.__MINLENGTH) {
        console.warn('There are not enough samples to make a training set of ' + training + ' elements and a test set of ' + test + ' elements.');
        if (training > test) {
          test = MNIST.__MINLENGTH * (test / training);
          training = MNIST.__MINLENGTH - training;
        }
        else {
          training = MNIST.__MINLENGTH * (training / test);
          test = MNIST.__MINLENGTH - test;
        }
      }
    
      // make both sets
      var trainingSet = [];
      var testSet = [];
    
      for (var i = 0; i < NUMBER_OF_DIGITS; i++) {
        trainingSet = trainingSet.concat(MNIST[i].set(0, training - 1));
        testSet = testSet.concat(MNIST[i].set(training, training + test - 1));
      }
    
      // return the sets, shuffled
      return {
        training: shuffle(trainingSet),
        test: shuffle(testSet)
      }
    }
    
    // draws a given digit in a canvas context
    MNIST.draw = function (digit, context, offsetX, offsetY) {
      var imageData = context.getImageData(offsetX || 0, offsetY || 0, size, size);
      for (var i = 0; i < digit.length; i++) {
        imageData.data[i * 4] = digit[i] * 255;
        imageData.data[i * 4 + 1] = digit[i] * 255;
        imageData.data[i * 4 + 2] = digit[i] * 255;
        imageData.data[i * 4 + 3] = 255;
      }
      context.putImageData(imageData, offsetX || 0, offsetY || 0);
    }
    
    // takes an array of 10 digits representing a number from 0 to 9 (ie. any output in a dataset) and returns the actual number
    MNIST.toNumber = function (array) {
      return array.indexOf(Math.max.apply(Math, array));
    }
    
    // CommonJS & AMD
    if (typeof define !== 'undefined' && define.amd) {
      define([], function () { return MNIST });
    }
    
    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = MNIST;
    }
    
    // Browser
    if (typeof window == 'object') {
      (function () {
        var old = window['mnist'];
        MNIST.ninja = function () {
          window['mnist'] = old;
          return MNIST;
        };
      })();
    
      window['mnist'] = MNIST;
    }
    
    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [rev. #1]
    
    function shuffle(v) {
      for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
      return v;
    };
  
    
 
    
   
  
  
    
    function App() {
      var set = MNIST.set(10, 1);
      
      var trainingSet = set.training;
      //console.log(trainingSet.length);
      var testSet = set.test;
      var d = 2;
      var training_data = prepare_data(trainingSet);
      console.log((training_data));
      var test_data = prepare_data(testSet);
      //console.log(test_data);
      
      var network = new Hopfield(784);
      network.train(training_data, "1");
      
      this._inputdrawingsElement = document.getElementById('input-drawing');
      this._Training_setdrawingsElement = document.getElementById('training_set');
      this._classificationdrawingsElement = document.getElementById('classification-drawing');
      var input_drawing = new Canvas();
      var classification_drawing = new Canvas();
      //var training_drawing = new Canvas();
      var digit = MNIST[d].get();
      input_drawing.setVector(f(digit));
      
      this.input_drawing = input_drawing;
      this.classification_drawing = classification_drawing;
      this._inputdrawingsElement.appendChild(input_drawing.element());
      //this._Training_setdrawingsElement.appendChild(training_drawing.element());
      this._classificationdrawingsElement.appendChild(classification_drawing.element());
      var boutonPrintCell = document.getElementById('print-cells');
      var boutonClassification = document.getElementById('run-classification');
      var boutonRefresh = document.getElementById('refresh');
      var boutonwhite = document.getElementById('white');
      var boutonwhiteraw = document.getElementById('whiteraw');
      var boutonblack = document.getElementById('black');
      var output_text = document.getElementById('output-classification');
      boutonPrintCell.addEventListener('click', function(){
        console.log(f(input_drawing.print_cells()));
      });
      let cpt = 1;
      boutonwhiteraw.addEventListener('click', function(){
        //input_drawing.setVector(Array.from({length: 784}, () => 1));
        input_drawing.setVector(Array.from({length: 784}, (_, index) => index < 28*cpt ? 1 : -1));
        cpt ++;
      });
      boutonwhite.addEventListener('click', function(){
        input_drawing.setVector(Array.from({length: 784}, () => 1));
      });
      boutonblack.addEventListener('click', function(){
        input_drawing.setVector(Array.from({length: 784}, () => -1));
      });
      boutonRefresh.addEventListener('click', function(){
        var digit = MNIST[d].get();
        input_drawing.setVector(f(digit));
      });
      boutonClassification.addEventListener('click', function(){
        // show the classification output image
        classification_drawing.setVector(network._run(f(input_drawing.print_cells())));
        // print the number output 
        console.log(network._run(f(input_drawing.print_cells())));
      });
      var self = this;
      document.getElementById('show-training-set').addEventListener('click', function() {
        for (let i =0; i<training_data.length; i++) {
        var training_drawing = new Canvas();
        self._Training_setdrawingsElement.appendChild(training_drawing.element());
        training_drawing.setVector(training_data[i]);}
      });
      document.getElementById('hide-training-set').addEventListener('click', function() {
        document.getElementById("training_set").innerHTML = "";});
      //console.log(network.patterns);
      //console.log(network.classify(drawing.print_cells()));
      //console.log(network.classify(test_data[0]));
      }    
    
  
      new App();
  
    
    //console.log(f(digit));
  });
  



  
  })();});