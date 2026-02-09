#!/bin/bash

# Add OAuth whitelist to .env
echo "" >> /opt/appgynsys/backend/.env
echo "# OAuth Security - Email Whitelist" >> /opt/appgynsys/backend/.env
echo "ALLOWED_OAUTH_EMAILS=\"marilouh.mh@gmail.com\"" >> /opt/appgynsys/backend/.env
echo "ALLOWED_OAUTH_DOMAINS=\"@gynsys.com\"" >> /opt/appgynsys/backend/.env

echo "OAuth whitelist added to .env"
