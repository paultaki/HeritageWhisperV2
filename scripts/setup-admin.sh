#!/bin/bash

# Setup Admin Role and Prompt Feedback
# This script sets up the prompt_feedback table and grants admin role

echo "🔧 Setting up admin role and prompt feedback..."
echo ""
echo "⚠️  IMPORTANT: Update the email in the migration file first!"
echo "   File: migrations/0012_setup_admin_and_feedback.sql"
echo "   Line: UPDATE users SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';"
echo ""
read -p "Have you updated the email? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Please update the email first, then run this script again."
    exit 1
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Apply migration
echo "📤 Applying migration to Supabase..."
psql "postgresql://postgres.tjycibrhoammxohemyhq:Redsox69Redsox@aws-0-us-west-1.pooler.supabase.com:6543/postgres" -f migrations/0012_setup_admin_and_feedback.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🎉 You should now be able to:"
    echo "   1. Access admin features"
    echo "   2. Submit prompt feedback"
    echo "   3. View feedback analytics"
else
    echo "❌ Migration failed. Check the error above."
    exit 1
fi
