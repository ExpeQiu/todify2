#!/bin/bash
echo "Starting at $(date)" >> /tmp/todify4-startup.log
cd /Volumes/Lexar/git/03T/GeelyTPD2/todify4/backend
PORT=8113 node dist/index.js >> /tmp/todify4-startup.log 2>&1
echo "Exited with code $? at $(date)" >> /tmp/todify4-startup.log
