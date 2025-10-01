#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Get API keys from env
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dpaciwcnzwyymjmkftrc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY environment variable is required');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' }) : null;
const server = new Server(
  {
    name: 'waterbar-emails',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Email templates as HTML functions
function getEmailTemplate(flow: string, data: any): string {
  const templates: Record<string, (d: any) => string> = {
    'aoi-booking-confirmation': (d) => `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #FAF7FF;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAF7FF; padding: 20px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; overflow: hidden;">
                <tr><td style="padding: 40px 20px 20px; background: linear-gradient(135deg, #6F3BD2 0%, #FF4FD8 100%); text-align: center;">
                  <h1 style="margin: 0 0 8px; color: #fff; font-size: 32px; font-weight: 700;">✨ Your Journey Awaits</h1>
                  <p style="margin: 0; color: #fff; font-size: 16px; opacity: 0.9;">Art of Implosion Experience Confirmed</p>
                </td></tr>
                <tr><td style="padding: 30px 20px;">
                  <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi <strong>${d.customerName || 'Guest'}</strong>,</p>
                  <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Your transformative experience at AOI has been confirmed. Here's your personalized journey timeline:</p>
                  <h2 style="margin: 20px 0 12px; font-size: 20px; font-weight: 600; color: #6F3BD2;">🕐 Your Experience Timeline</h2>
                  <p style="margin: 0 0 24px; font-size: 14px; color: #666; font-weight: 500;">${new Date(d.bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  ${(d.bookings || []).map((b: any) => `
                    <div style="margin-bottom: 24px;">
                      <div style="display: inline-block; background: #6F3BD2; border-radius: 8px; padding: 8px 12px;">
                        <span style="color: #fff; font-size: 14px; font-weight: 600;">${b.time}</span>
                      </div>
                      <div style="margin-top: 8px;">
                        <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 4px;">${b.experience}</div>
                        <div style="font-size: 14px; color: #666; margin-bottom: 12px;">${b.duration} minutes</div>
                        ${b.preDrink || b.duringDrink || b.afterDrink ? `
                          <div style="background: #FFF6EA; border: 2px solid #FF4FD8; border-radius: 8px; padding: 12px; margin-top: 12px;">
                            <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px;">🥤 Paired Drinks:</div>
                            ${b.preDrink ? `<div style="font-size: 14px; color: #555; margin: 4px 0;">• Pre: ${b.preDrink}</div>` : ''}
                            ${b.duringDrink ? `<div style="font-size: 14px; color: #555; margin: 4px 0;">• During: ${b.duringDrink}</div>` : ''}
                            ${b.afterDrink ? `<div style="font-size: 14px; color: #555; margin: 4px 0;">• After: ${b.afterDrink}</div>` : ''}
                          </div>
                        ` : ''}
                        ${b.explanation ? `
                          <div style="margin-top: 12px; padding: 12px; background: #F5F0FF; border-left: 3px solid #6F3BD2; border-radius: 4px;">
                            <span style="font-size: 13px; color: #666; line-height: 1.5;">💡 <em>${b.explanation}</em></span>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
                  <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">📍 LOCATION</div>
                    <div style="font-size: 16px; font-weight: 500; color: #333;">${d.venue || 'AOI - Al Quoz, Dubai'}</div>
                  </div>
                  ${d.paymentUrl ? `
                    <div style="text-align: center; margin: 20px 0;">
                      <a href="${d.paymentUrl}" style="display: inline-block; background: #6F3BD2; border-radius: 8px; color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px;">Complete Payment - ${d.totalAmount || 'AED 180.00'}</a>
                      <p style="margin: 12px 0 0; font-size: 13px; color: #666;">Secure your booking by completing payment</p>
                    </div>
                  ` : ''}
                  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
                  <div style="text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #666;">Questions? Reply to this email or WhatsApp us</p>
                    <p style="margin: 0 0 16px; font-size: 14px; color: #666;"><a href="https://artofimplosion.com" style="color: #6F3BD2; text-decoration: underline;">artofimplosion.com</a></p>
                    <p style="margin: 0; font-size: 12px; color: #999;">Art of Implosion © 2025 | Al Quoz, Dubai, UAE</p>
                  </div>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
    'water-bar-order-confirmation': (d) => `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF7FF;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fff; border-radius: 12px; padding: 24px;">
              <h2 style="margin: 0 0 16px; color: #6F3BD2;">Thank you for your order!</h2>
              <p style="margin: 0 0 16px; color: #333;">Hi <strong>${d.customerName || 'Guest'}</strong>, your Water Bar order is confirmed.</p>
              <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <div style="font-weight: 600; color: #333; margin-bottom: 8px;">Order #${d.orderId || 'XXXXX'}</div>
                <div style="color: #666;">Total: ${d.total || 'AED 0.00'}</div>
              </div>
              <p style="margin: 16px 0 0; font-size: 12px; color: #999;">© 2025 The Water Bar</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
  
  const template = templates[flow];
  if (!template) {
    throw new Error(`Unknown template flow: ${flow}`);
  }
  
  return template(data);
}

function getSubject(flow: string, data: any): string {
  const subjects: Record<string, (d: any) => string> = {
    'aoi-booking-confirmation': (d) => `✨ Your AOI Experience is Confirmed`,
    'water-bar-order-confirmation': (d) => `Your Water Bar Order #${d.orderId || 'XXXXX'}`,
    'water-bar-followup': (d) => `Thanks for visiting The Water Bar! 💧`,
    'water-bar-missed-you': (d) => `We missed you at The Water Bar`,
  };
  
  return subjects[flow]?.(data) || `Notification from The Water Bar`;
}

// ============= TOOLS =============

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'send_waterbar_email',
        description: 'Send branded emails for Water Bar / AOI using templates',
        inputSchema: {
          type: 'object',
          properties: {
            flow: {
              type: 'string',
              description: 'Email template to use',
              enum: ['aoi-booking-confirmation', 'water-bar-order-confirmation', 'water-bar-followup', 'water-bar-missed-you'],
            },
            to: { type: 'string', description: 'Recipient email address' },
            data: { type: 'object', description: 'Template data payload' },
          },
          required: ['flow', 'to', 'data'],
        },
      },
      {
        name: 'list_emails',
        description: 'List recent emails sent via Resend (for debugging/verification)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of emails to return (default 10, max 100)', default: 10 },
          },
        },
      },
      {
        name: 'get_email',
        description: 'Get details of a specific email by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Email ID from Resend' },
          },
          required: ['id'],
        },
      },
      {
        name: 'cancel_email',
        description: 'Cancel a scheduled email',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Email ID to cancel' },
          },
          required: ['id'],
        },
      },
      {
        name: 'list_domains',
        description: 'List all verified sender domains',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_domain',
        description: 'Get domain verification status',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Domain ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'create_payment_link',
        description: 'Create a Stripe payment link for booking',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: 'Amount in cents (e.g., 18000 for AED 180.00)' },
            currency: { type: 'string', description: 'Currency code (default: aed)', default: 'aed' },
            description: { type: 'string', description: 'Payment description' },
            bookingId: { type: 'string', description: 'Booking ID to associate with payment' },
          },
          required: ['amount', 'description'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // ===== SEND EMAIL =====
    if (name === 'send_waterbar_email') {
      const { flow, to, data } = args as { flow: string; to: string; data: any };
      
      console.error(`📧 Sending ${flow} email to ${to}...`);
      
      const html = getEmailTemplate(flow, data);
      const subject = getSubject(flow, data);
      
      const result = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject,
        html,
      });

      console.error(`✅ Email sent! ID: ${result.data?.id}`);

      // Log to Supabase for tracking
      if (result.data?.id) {
        await supabase.from('email_log').insert({
          id: result.data.id,
          to_email: to,
          subject,
          html,
          flow,
          status: 'sent',
        });
        console.error(`📝 Logged to Supabase: ${result.data.id}`);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            emailId: result.data?.id,
            flow,
            to,
            subject,
          }, null, 2),
        }],
      };
    }

    // ===== LIST EMAILS =====
    // Query Supabase email_log (our own tracking system)
    if (name === 'list_emails') {
      const { limit = 10 } = args as { limit?: number };
      
      console.error(`📋 Listing last ${limit} emails from Supabase...`);
      
      const { data, error } = await supabase
        .from('email_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Math.min(limit, 100));

      if (error) {
        console.error(`❌ Supabase error:`, error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: data?.length || 0,
            emails: data || [],
          }, null, 2),
        }],
      };
    }

    // ===== GET EMAIL =====
    if (name === 'get_email') {
      const { id } = args as { id: string };
      
      console.error(`🔍 Getting email ${id}...`);
      
      const result = await resend.emails.get(id);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            email: result.data,
          }, null, 2),
        }],
      };
    }

    // ===== CANCEL EMAIL =====
    if (name === 'cancel_email') {
      const { id } = args as { id: string };
      
      console.error(`❌ Cancelling email ${id}...`);
      
      const result = await resend.emails.cancel(id);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            cancelled: result.data,
          }, null, 2),
        }],
      };
    }

    // ===== LIST DOMAINS =====
    if (name === 'list_domains') {
      console.error(`🌐 Listing domains...`);
      
      const result = await resend.domains.list();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            domains: result.data?.data || [],
          }, null, 2),
        }],
      };
    }

    // ===== GET DOMAIN =====
    if (name === 'get_domain') {
      const { id } = args as { id: string };
      
      console.error(`🔍 Getting domain ${id}...`);
      
      const result = await resend.domains.get(id);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            domain: result.data,
          }, null, 2),
        }],
      };
    }

    // ===== CREATE PAYMENT LINK =====
    if (name === 'create_payment_link') {
      if (!stripe) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Stripe not configured. Set STRIPE_SECRET_KEY environment variable.',
            }, null, 2),
          }],
          isError: true,
        };
      }

      const { amount, currency = 'aed', description, bookingId } = args as {
        amount: number;
        currency?: string;
        description: string;
        bookingId?: string;
      };
      
      console.error(`💳 Creating Stripe payment link: ${description} - ${amount/100} ${currency.toUpperCase()}`);
      
      // Create payment link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: amount,
              product_data: {
                name: description,
              },
            },
            quantity: 1,
          },
        ],
        metadata: bookingId ? { booking_id: bookingId } : {},
        after_completion: {
          type: 'hosted_confirmation',
          hosted_confirmation: {
            custom_message: '✨ Payment successful! Check your email for your receipt and hydration tracking link.',
          },
        },
      });

      console.error(`✅ Payment link created: ${paymentLink.url}`);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            paymentLink: {
              id: paymentLink.id,
              url: paymentLink.url,
              amount: amount,
              currency: currency,
              description: description,
            },
          }, null, 2),
        }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
    
  } catch (error: any) {
    console.error(`❌ Tool ${name} failed:`, error);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          tool: name,
        }, null, 2),
      }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Water Bar Email MCP Server v2.0 running');
  console.error('📧 Tools: send, list, get, cancel emails + domain management');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
