#!/bin/bash

# Backup
cp /opt/appgynsys/backend/.env /opt/appgynsys/backend/.env.backup_final

# Remove all VAPID lines
grep -v "^VAPID" /opt/appgynsys/backend/.env > /opt/appgynsys/backend/.env.tmp

# Add new valid VAPID keys from vapidkeys.com
cat >> /opt/appgynsys/backend/.env.tmp << 'EOF'
VAPID_PUBLIC_KEY="BI1Q6t_INHwdGa7XU_mIbaq_3ebqH2NZ7IImp3eowepljtxzguo1lfLH57jxbtALqCorMZraDK9Rim1ylHcFR0E"
VAPID_PRIVATE_KEY="WwcdixOvWNQSNLi2Zr_Wnq1n-NkDXsPfyIliwnS-Dek"
VAPID_CLAIM_EMAIL="admin@gynsys.com"
EOF

mv /opt/appgynsys/backend/.env.tmp /opt/appgynsys/backend/.env

echo "Updated with new VAPID keys from vapidkeys.com"
