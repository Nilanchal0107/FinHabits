@echo off
python test_ai_simple.py > error_log.txt 2>&1
type error_log.txt
