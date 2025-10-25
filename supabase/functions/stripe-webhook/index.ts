import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    }
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
      return;
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: priceId,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }

    // Get customer email and create/update user token
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted && customer.email) {
      // Determine tier based on price_id
      let tier = 'basic';
      if (priceId.toLowerCase().includes('premium')) {
        tier = 'premium';
      }

      // Only create/update token if subscription is active
      const isActiveSubscription = ['active', 'trialing'].includes(subscription.status);

      if (isActiveSubscription) {
        const { data: existingToken } = await supabase
          .from('user_tokens')
          .select('token, tier')
          .eq('email', customer.email)
          .maybeSingle();

        if (!existingToken) {
          const { data: newToken, error: tokenError } = await supabase
            .from('user_tokens')
            .insert({ email: customer.email, tier })
            .select()
            .maybeSingle();

          if (tokenError) {
            console.error('Error creating user token:', tokenError);
          } else if (newToken) {
            console.info(`Created user token for ${customer.email} with tier: ${tier}`);
            const managementUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/manage/${newToken.token}`;
            console.log('Management URL:', managementUrl);
          }
        } else {
          const oldTier = existingToken.tier;

          // Only update if tier changed
          if (oldTier !== tier) {
            // Cancel old subscriptions before updating tier
            try {
              const oldSubscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 100,
              });

              // Cancel all subscriptions except the current one
              for (const oldSub of oldSubscriptions.data) {
                if (oldSub.id !== subscription.id) {
                  await stripe.subscriptions.cancel(oldSub.id);
                  console.info(`Cancelled old subscription ${oldSub.id} for customer ${customerId}`);
                }
              }
            } catch (cancelError) {
              console.error(`Error cancelling old subscriptions for ${customer.email}:`, cancelError);
            }

            await supabase
              .from('user_tokens')
              .update({ tier })
              .eq('email', customer.email);
            console.info(`Updated tier for ${customer.email} from ${oldTier} to: ${tier}`);

            // Upgrade all existing submissions to the new tier (only if upgrading)
            const tierLevels = { basic: 1, premium: 2 };
            const isUpgrade = tierLevels[tier as 'basic' | 'premium'] > tierLevels[oldTier as 'basic' | 'premium'];

            if (isUpgrade) {
              const { error: upgradeError } = await supabase
                .from('software_submissions')
                .update({ tier })
                .eq('email', customer.email);

              if (upgradeError) {
                console.error(`Error upgrading submissions for ${customer.email}:`, upgradeError);
              } else {
                console.info(`Upgraded all submissions for ${customer.email} to tier: ${tier}`);
              }
            }
          }
        }
      } else if (['canceled', 'past_due', 'unpaid'].includes(subscription.status)) {
        // Handle cancelled/inactive subscriptions - revert to free tier

        // Revert all submissions to free tier
        const { error: revertError } = await supabase
          .from('software_submissions')
          .update({
            tier: 'free',
            homepage_featured: false,
            newsletter_featured: false,
            analytics_enabled: false,
            monthly_analytics_enabled: false,
            social_media_mentions: false,
            category_logo_enabled: false
          })
          .eq('email', customer.email);

        if (revertError) {
          console.error(`Error reverting submissions to free tier for ${customer.email}:`, revertError);
        } else {
          console.info(`Reverted all submissions to free tier for ${customer.email}`);
        }

        // Remove user token
        const { error: deleteError } = await supabase
          .from('user_tokens')
          .delete()
          .eq('email', customer.email);

        if (deleteError) {
          console.error(`Error removing user token for ${customer.email}:`, deleteError);
        } else {
          console.info(`Removed user token for ${customer.email} due to subscription status: ${subscription.status}`);
        }
      }
    }

    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}