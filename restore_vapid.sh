#!/bin/bash

# Cleanup and restore original VAPID keys format
cp /opt/appgynsys/backend/.env /opt/appgynsys/backend/.env.backup4

# Remove all VAPID lines
grep -v "^VAPID" /opt/appgynsys/backend/.env > /opt/appgynsys/backend/.env.tmp

# Add original short-format VAPID keys (these are base64url-encoded, which is correct)
cat >> /opt/appgynsys/backend/.env.tmp << 'EOF'
VAPID_PUBLIC_KEY="BO5hos8aE5Ltn-DUrZWJnwI0nfItv6luV_ESDBiy Mo6VKvg6Ub0O6LyLnx17lIQxmGhdA3xBXcFP1eGTPYL_keo"
VAPID_PRIVATE_KEY="Ci8Y535U2ynsJiXDT3FLVlAQd-qaP7--1OCrbO5F068"
VAPID_CLAIM_EMAIL="admin@gynsys.com"
EOF

mv /opt/appgynsys/backend/.env.tmp /opt/appgynsys/backend/.env

echo "Restored original VAPID keys (without mailto: prefix)"
