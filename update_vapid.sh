#!/bin/bash

# Backup
cp /opt/appgynsys/backend/.env /opt/appgynsys/backend/.env.backup2

# Remove old VAPID keys
sed -i '/^VAPID_PRIVATE_KEY=/d' /opt/appgynsys/backend/.env
sed -i '/^VAPID_PUBLIC_KEY=/d' /opt/appgynsys/backend/.env

# Add new VAPID keys (base64 format)
cat >> /opt/appgynsys/backend/.env << 'EOF'
VAPID_PRIVATE_KEY="MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgHgAokjZK1t0Q7wPSR34d+syWGtV3LUUY37agsK8QUPmhRANCAASE5jbPSDbqkgK2J2xThhuA8ppEUOpTVXOytGCER/Gw2V6uSI5tCS36ruqEXsC1Aktu3wbUsZQwNeOB9szqLiXG"
VAPID_PUBLIC_KEY="MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEhOY2z0g26pICtidsU4YbgPKaRFDqU1VzsrRghEfxsNlerkiObQkt+q7qhF7AtQJLbt8G1LGUMDXjgfbM6i4lxg=="
EOF

echo "VAPID keys updated (base64 format)"
