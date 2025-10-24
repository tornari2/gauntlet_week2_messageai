#!/bin/bash

# Deploy Firebase Storage Rules
# This script deploys the storage rules to Firebase

echo "🔥 Deploying Firebase Storage Rules..."

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login if not already logged in
echo "🔐 Checking Firebase login status..."
firebase login --reauth

# Deploy storage rules
echo "📤 Deploying storage rules..."
firebase deploy --only storage --project $(grep EXPO_PUBLIC_FIREBASE_PROJECT_ID .env | cut -d '=' -f2)

echo "✅ Storage rules deployed successfully!"
echo ""
echo "Your Firebase Storage is now configured to:"
echo "  - Allow authenticated users to upload images"
echo "  - Limit uploads to 5MB per file"
echo "  - Store images in /chat-images/{chatId}/{timestamp}.jpg"

