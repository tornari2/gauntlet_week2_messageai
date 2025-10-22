#!/bin/bash

# Deploy Firebase Realtime Database Rules
# Run this script to update the Firebase Realtime Database security rules

echo "🔐 Deploying Firebase Realtime Database rules..."

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Deploy only database rules
firebase deploy --only database

echo "✅ Database rules deployed successfully!"
echo ""
echo "The following rules have been deployed:"
echo "  - /status/{uid} - User presence status (read: public, write: own only)"
echo "  - /notifications/{uid} - User notification queue (read: own only, write: authenticated)"

