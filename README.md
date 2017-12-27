# JJLend

## Introduction

JJLend: a reputation-based smart lending system using Ethereum blockchain network. It's the final project for the course ECE750 Distributed and Network-Centric Computing.

## Prerequisites

Here's the software you need to run the program:
+ go-ethereum (>= 1.7.3)
+ Solidity (>= 0.4.18)
+ Truffle (>= 4.0.1)

## How to set up the private Ethereum network

+ Start the bootnode

In the *privateNetwork* directory, run the following command:

```
./boot.sh
```

+ Start the member nodes (the script will start 5 nodes):
```
./run.sh
```

When you start the member nodes, you can attach to any node instance and start to mine.
```
./attach.sh <node_id>
> miner.start()
```

## How to compile the smart contracts

In the main directory, run the following command:
```
./build.sh
```

## How to migrate the smart contracts

In the main directory, you can choose to migrate the contracts to the private network or to any test network configured in *truffle.js*:
```
truffle migrate --network <ethereum_network>
```

## How to test the smart contracts

The test scripts are stored in *execTest* directory. You can choose to test the contracts to the private network or to any test network configured in *truffle.js*. 

Before you run the test on the private network, remember to create and unlock the required number of accounts in the node that you connect to. Besides, make sure that you have mined some *ether* in each account.

In the main directory, you can use the *exec.sh* script to run the test scripts.

```
./exec.sh <test_script> <ethereum_network>
```

## How to run experiments to retrieve the blockchain data

Start the *testrpc* network, then run the following command:
```
./ml/gen_all.sh
```

## Build and test environment

+ Build and test: 
```
ubuntu 16.04
```

## Project report
Please review the *report.pdf* for details.
