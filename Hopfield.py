import numpy as np

class HopfieldNetwork :
    def __init__(self, numberNeurons) :
        self.INTERVAL = 20
        self.ACTIVATION_THRESHOLD = 0
        self.CONVERGE_NODES = 5
        self.num_neurons = numberNeurons
        self._weights = []
        self._values = []
        for i in range(self.numberNeurons):
            self._weights[i] = []
            self._values[i] = -1
        for j in range(self.numberNeurons):
            self._weights[i][j] = 1
        
    
    def train(self, samples) :
        self._resetWeights()
        assert(self.num_neurons == len(self._values))
        for i in range(self.numberNeurons):
            for j in range(self.numberNeurons):
                for k in range(len(samples)) :
                    if samples[k][i] == samples[k][j] :
                        self._weights[i][j] += 1 / len(samples)
                    else :
                        self._weights[i][j] -= 1 / len(samples)
                    
    def _resetWeights(self) :
        assert(self.num_neurons == len(self._values))
        for i in range(self.numberNeurons):
            for j in range(self.numberNeurons):
                self._weights[i][j] = 0
      
    def convergeStep(self) :
        for x in range(self.CONVERGE_NODES) :
            self._convergeRandomNode()
    
    def _convergeRandomNode(self) :
        nodeIndex = np.floor(np.random() * self._values.length)
        sum = 0
        for j in range(len(self._values)):
            if j == nodeIndex:
                continue
       
        w = self._weights[nodeIndex][j]
        v = self._values[j]
        sum += w * v
        
        if sum > self.ACTIVATION_THRESHOLD :
            self._values[nodeIndex] = 1
        else :
            self._values[nodeIndex] = -1
        

    def setVector(self, values) :
        for i in range(len(self._values)):
            self._values[i] = values[i]
    
    def vector(self) :
        return self._values.slice()



network = HopfieldNetwork()

network.train(sample)
