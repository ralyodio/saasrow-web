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
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();

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

  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const checkoutSession = stripeData as Stripe.Checkout.Session;
      const { mode } = checkoutSession;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);

      // Store order record for billing history
      if (checkoutSession.payment_intent && checkoutSession.payment_status === 'paid') {
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id: checkoutSession.id,
          payment_intent_id: typeof checkoutSession.payment_intent === 'string'
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent.id,
          customer_id: customerId,
          amount_subtotal: checkoutSession.amount_subtotal || 0,
          amount_total: checkoutSession.amount_total || 0,
          currency: checkoutSession.currency || 'usd',
          payment_status: checkoutSession.payment_status,
          status: 'completed',
        });

        if (orderError) {
          console.error('Error inserting order record:', orderError);
        } else {
          console.info(`Created order record for session ${checkoutSession.id}`);
        }
      }
    }

    // Handle recurring invoice payments
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = stripeData as Stripe.Invoice;

      if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
        console.info(`Processing recurring subscription payment for invoice ${invoice.id}`);

        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id: invoice.id,
          payment_intent_id: typeof invoice.payment_intent === 'string'
            ? invoice.payment_intent
            : invoice.payment_intent?.id || invoice.id,
          customer_id: customerId,
          amount_subtotal: invoice.subtotal || 0,
          amount_total: invoice.amount_paid || 0,
          currency: invoice.currency || 'usd',
          payment_status: 'paid',
          status: 'completed',
        });

        if (orderError) {
          console.error('Error inserting recurring payment order:', orderError);
        } else {
          console.info(`Created order record for recurring invoice ${invoice.id}`);
        }
      }
    }

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    }
  }
}

async function syncCustomerFromStripe(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

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

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;

    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = customer && !customer.deleted && customer.email ? customer.email : null;

    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: priceId,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        email: customerEmail,
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

    if (customerEmail) {
      let tier = 'featured';
      if (priceId.toLowerCase().includes('premium')) {
        tier = 'premium';
      }

      const isActiveSubscription = ['active', 'trialing'].includes(subscription.status);

      if (isActiveSubscription) {
        const { data: existingToken } = await supabase
          .from('user_tokens')
          .select('token, tier')
          .eq('email', customerEmail)
          .maybeSingle();

        if (!existingToken) {
          const { data: newToken, error: tokenError } = await supabase
            .from('user_tokens')
            .insert({ email: customerEmail, tier })
            .select()
            .maybeSingle();

          if (tokenError) {
            console.error('Error creating user token:', tokenError);
          } else if (newToken) {
            console.info(`Created user token for ${customerEmail} with tier: ${tier}`);
            const managementUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/manage/${newToken.token}`;
            console.log('Management URL:', managementUrl);

            const { error: upgradeError } = await supabase
              .from('software_submissions')
              .update({ tier })
              .eq('email', customerEmail);

            if (upgradeError) {
              console.error(`Error upgrading submissions for ${customerEmail}:`, upgradeError);
            } else {
              console.info(`Upgraded all submissions for ${customerEmail} to tier: ${tier}`);
            }
          }
        } else {
          const oldTier = existingToken.tier;

          if (oldTier !== tier) {
            try {
              const oldSubscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 100,
              });

              for (const oldSub of oldSubscriptions.data) {
                if (oldSub.id !== subscription.id) {
                  await stripe.subscriptions.cancel(oldSub.id);
                  console.info(`Cancelled old subscription ${oldSub.id} for customer ${customerId}`);
                }
              }
            } catch (cancelError) {
              console.error(`Error cancelling old subscriptions for ${customerEmail}:`, cancelError);
            }

            await supabase
              .from('user_tokens')
              .update({ tier })
              .eq('email', customerEmail);
            console.info(`Updated tier for ${customerEmail} from ${oldTier} to: ${tier}`);

            const tierLevels = { featured: 1, premium: 2 };
            const isUpgrade = tierLevels[tier as 'featured' | 'premium'] > tierLevels[oldTier as 'featured' | 'premium'];

            if (isUpgrade) {
              const { error: upgradeError } = await supabase
                .from('software_submissions')
                .update({ tier })
                .eq('email', customerEmail);

              if (upgradeError) {
                console.error(`Error upgrading submissions for ${customerEmail}:`, upgradeError);
              } else {
                console.info(`Upgraded all submissions for ${customerEmail} to tier: ${tier}`);
              }
            }
          }
        }
      } else if (['canceled', 'past_due', 'unpaid'].includes(subscription.status)) {
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
          .eq('email', customerEmail);

        if (revertError) {
          console.error(`Error reverting submissions to free tier for ${customerEmail}:`, revertError);
        } else {
          console.info(`Reverted all submissions to free tier for ${customerEmail}`);
        }

        const { error: deleteError } = await supabase
          .from('user_tokens')
          .delete()
          .eq('email', customerEmail);

        if (deleteError) {
          console.error(`Error removing user token for ${customerEmail}:`, deleteError);
        } else {
          console.info(`Removed user token for ${customerEmail} due to subscription status: ${subscription.status}`);
        }
      }
    }

    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}
