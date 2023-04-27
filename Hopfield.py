#!/usr/bin/env python3
# Setup
import matplotlib.pyplot as plt
import numpy as np # linear algebra
import pandas as pd # data processing, CSV file I/O (e.g. pd.read_csv)
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from itertools import combinations, product
from tqdm import tqdm # progress bar

# import data
allTrain = pd.read_csv( './datapy/train.csv' )
n = len( allTrain )
X_train = allTrain.drop( 'label', 1).to_numpy()
print(np.shape(X_train))
Y_train = allTrain[ 'label' ].to_numpy()
del allTrain
test = pd.read_csv( './datapy/test.csv' )
X_test = test.to_numpy()
print( "data import complete" )


class HopfieldNetwork( object ):
    def __init__( self, pattern, rule='pseudo-inverse' ):
        '''expects patterns to have values belonging to {-1, 1}
           initializes with Hebbian rule'''
        self.n = pattern[0].size
        self.order = np.arange( self.n )
        
        if rule == 'hebbian':
            self.w = np.tensordot( pattern, pattern, axes=( ( 0 ), ( 0 ) ) ) / len( pattern )
            self.w[ self.order, self.order ] = 0.0
        elif rule == 'pseudo-inverse':
            c = np.tensordot( pattern, pattern, axes=( ( 1 ), ( 1 ) ) ) / len( pattern )
            cinv = np.linalg.inv( c )
            self.w = np.zeros( ( self.n, self.n ) )
            for k, l in product( range( len( pattern ) ), range( len( pattern ) ) ):
                self.w = self.w + cinv[ k, l ] * pattern[ k ] * pattern[ l ].reshape( ( -1, 1 ) )
            self.w = self.w / len( pattern )
        else:
            assert false, 'invalid learning rule: {}\nplease choose hebbian or pseudo-inverse'.format( rule )

    def processBatch( self, x, iters=4 ):
        '''input should be same size format as patterns. Implements asynchronous update'''
        h = np.array( x, dtype=float )
        for _ in range( iters ):
            np.random.shuffle( self.order )
            for i in self.order:
                h[ :, i ] = np.tensordot( self.w[ i ], h, axes=( ( -1 ), ( -1 ) ) )
                h[ :, i ] = np.where( h[ :, i ] < 0, -1.0, 1.0 )
        return h

# create and train hopfield networks (one for each pair, because expressiveness sucketh)

#preprocess samples
supervised = True
iters = 8

factor = 2.0 / np.max( X_train )
avg_classes = lambda: np.array( [ factor * np.mean( X_train[ Y_train == l, : ], axis=0 ) - 1.0
                                  for l in np.unique( Y_train ) ] )
patterns = avg_classes() if supervised else ( factor * X_train - 1 )
threshold = np.zeros( iters )
bitPatterns = np.where( patterns < threshold[ -1 ], -1, 1 )
XB_train = np.where( ( factor * X_train - 1 ) < threshold[ -1 ], -1, 1 ) if supervised else bitPatterns

hopnet = HopfieldNetwork( bitPatterns )
XH_train = hopnet.processBatch( XB_train )
print((XH_train))
print((XB_train))
# peek results; run again to see a new selection
# processed image

plt.imshow( XH_train[ 5 ].reshape( ( 28, 28 ) ), cmap='gray' )