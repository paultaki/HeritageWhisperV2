/**
 * Email Configuration Diagnostic Script
 * Run with: npx tsx scripts/test-email.ts
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmailConfig() {
  console.log('🔍 Email Configuration Diagnostic\n');
  console.log('═══════════════════════════════════════\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || '❌ Not set'}`);
  console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || '❌ Not set'}`);
  console.log();

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set!');
    process.exit(1);
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.error('❌ RESEND_FROM_EMAIL is not set!');
    process.exit(1);
  }

  // Test Resend API
  console.log('🧪 Testing Resend API Connection...\n');

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Test with a simple email (won't actually send, just validate)
    console.log('From address:', process.env.RESEND_FROM_EMAIL);
    console.log('Domain:', process.env.RESEND_FROM_EMAIL.match(/@(.+)>/)?.[1] || 'unknown');
    console.log();

    // List domains (this will show if domain is verified)
    console.log('📡 Checking Resend domains...');
    console.log('(If this fails, your domain might not be verified in Resend)\n');

    // Try to send a test email (you can comment this out if you don't want to send)
    console.log('💌 Attempting to send test email...');
    console.log('(This will try to send to test@example.com - it may fail but will show us the error)\n');

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: 'test@example.com',
      subject: 'HeritageWhisper Email Test',
      html: '<p>This is a test email to verify configuration.</p>',
    });

    if (error) {
      console.error('❌ Resend API Error:');
      console.error(JSON.stringify(error, null, 2));
      console.log('\n📝 Common Error Fixes:');
      console.log('1. Domain not verified in Resend dashboard');
      console.log('2. DNS records not propagated (wait 24-48 hours)');
      console.log('3. Wrong API key (generate new one in Resend)');
      console.log('4. From address doesn\'t match verified domain');
    } else {
      console.log('✅ Email API test successful!');
      console.log('Email ID:', data?.id);
      console.log('\n⚠️  Note: Email was sent to test@example.com and will likely bounce.');
      console.log('But this proves your Resend configuration is working!');
    }
  } catch (err: any) {
    console.error('❌ Exception occurred:');
    console.error(err.message);
    console.error('\nFull error:', err);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('✅ Diagnostic Complete');
}

testEmailConfig();
