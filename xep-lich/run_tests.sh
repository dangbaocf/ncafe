#!/bin/sh
cd /home/claude/chamcong
(cat test_env.js; sed 's#//ENV##' test_all.js) | sed "s#__dirname+'/#'/home/claude/chamcong/#g" > /tmp/run_tests.js
node /tmp/run_tests.js 2>&1 | grep -E "^(✘|KẾT|.*LỖI)" 
