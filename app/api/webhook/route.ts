import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// 2. Initialize Supabase with the ADMIN key to bypass security policies securely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    // Verify this request actually came from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // 3. If the payment was successful, unlock the Pro features!
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Remember how we passed the userId into client_reference_id in our checkout route? 
    // This is where we grab it back!
    const userId = session.client_reference_id; 

    if (userId) {
      console.log(`Payment successful for User ID: ${userId}. Upgrading to PRO...`);
      
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile to Pro:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      
      console.log('User successfully upgraded to Pro!');
    }
  }

  // Tell Stripe we received the message so they stop trying to send it
  return NextResponse.json({ received: true });
}