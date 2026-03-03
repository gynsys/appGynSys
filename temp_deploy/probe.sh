#!/bin/bash
cd /opt/appgynsys
docker compose exec -T backend python -c "import sys; print('SYS_PATH:', sys.path); import os; print('CWD:', os.getcwd()); print('FILES:', os.listdir('.'))"
