#!/bin/bash

truffle compile
truffle migrate --reset
truffle exec ml/run.js
for i in {1..5}
do
    truffle exec ml/run1_2.js
    truffle exec ml/run2_1.js
done
for i in {1..5}
do
    truffle exec ml/run_rand.js
done
truffle exec ml/get_log.js > ml/eventData.txt
