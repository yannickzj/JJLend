#!/bin/bash

truffle compile >> /dev/null 2>&1

truffle migrate --reset --network $1 >> /dev/null 2>&1
truffle exec ml/run.js --netwrok $1 >> /dev/null 2>&1
start_time="$(date -u +%s.%N)"
for i in `seq 1 $2`
do
    truffle exec execTest/testThroughput.js --network $1 >> /dev/null 2>&1
done
end_time="$(date -u +%s.%N)"
elapsed="$(bc <<<"$end_time-$start_time")"
echo "Total of $elapsed seconds elapsed for $2 random lending execution"