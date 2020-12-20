#!/bin/bash

#
# npm links the examples directory to the local copy of json-rules-engine
# and runs all examples. This can be used to test a release candidate version
# against the examples as an extra compatiblity test
#
THIS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd $THIS_DIR/../.. # project root
npm run build
npm link
cd $THIS_DIR/../../examples # examples directory
npm link json-rules-engine
for i in *.js; do node $i; done;
