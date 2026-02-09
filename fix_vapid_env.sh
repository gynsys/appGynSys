#!/bin/bash

# Backup
cp /opt/appgynsys/backend/.env /opt/appgynsys/backend/.env.backup3

# Remove ALL VAPID-related lines (including broken multi-line ones)
grep -v "VAPID" /opt/appgynsys/backend/.env | grep -v "^MI" | grep -v "^DCUAOVS" | grep -v "^auUbvjRBeq" | grep -v "^Gmn7rP5I$" | grep -v "^HdPdDIhHwVzDXVjC" | grep -v "^-----END" | grep -v "^MFkwEwYHKo" | grep -v "^txpp" | grep -v "^SB3T3QyIR" | grep -v "^nA==$" | grep -v "^G0wawIBAQQgHgAokj" | grep -v "^ANCAASE5jbPSDbqkg" | grep -v "^S36ruqEXsC1Aktu" | grep -v "^Y2z0g26pICtidsU4Yb" | grep -v "^7AtQJLbt8G1LGUMDXj" > /opt/appgynsys/backend/.env.tmp

# Add clean VAPID keys on single lines
cat >> /opt/appgynsys/backend/.env.tmp << 'EOF'
VAPID_PRIVATE_KEY="MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgHgAokjZK1t0Q7wPSR34d+syWGtV3LUUY37agsK8QUPmhRANCAASE5jbPSDbqkgK2J2xThhuA8ppEUOpTVXOytGCER/Gw2V6uSI5tCS36ruqEXsC1Aktu3wbUsZQwNeOB9szqLiXG"
VAPID_PUBLIC_KEY="MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEhOY2z0g26pICtidsU4YbgPKaRFDqU1VzsrRghEfxsNlerkiObQkt+q7qhF7AtQJLbt8G1LGUMDXjgfbM6i4lxg=="
EOF

# Replace the original file
mv /opt/appgynsys/backend/.env.tmp /opt/appgynsys/backend/.env

echo "Cleaned and updated VAPID keys"
