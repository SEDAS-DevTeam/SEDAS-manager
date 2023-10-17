import torchvision
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torchvision import datasets, transforms

import numpy as np
import math


###
###VERSION 1
###

def to_n_grid(str_input):
    grid = []

    for char in str_input:
        grid.append(int(char))

    side_len = int(math.sqrt(len(grid)))

    grid = np.array(grid)
    grid = grid.reshape((side_len, side_len))
    print(grid)

###GRADIENT GENERATION
class BilinearGGA: #gradient generation algorithm
    def __init__(self):
        pass

class BicubicGGA:
    def __init__(self):
        pass

class cubicSplineGGA:
    def __init__(self):
        pass

class GGN(nn.Module): #gradient generation network
    def __init__(self):
        super(GGN, self).__init__()
    
    def forward(self):
        pass


###
###MAIN CODE
###

def train():
    pass

def test():
    pass

def valid():
    pass

def main(str_input):
    to_n_grid(str_input)

if __name__ == "__main__":
    main("1234567812345678")