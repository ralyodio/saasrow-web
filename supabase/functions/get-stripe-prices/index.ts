import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) {
      return new Response(
        JSON.stringify({ error: 'Stripe secret key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const stripe = new Stripe(stripeSecret, {
      appInfo: {
        name: 'SaaSRow',
        version: '1.0.0',
      },
    });

    const productIds = {
      basicMonthly: 'prod_TIVW8LKczKXUma',
      basicYearly: 'prod_TIVXfMn8dzZo6K',
      premiumMonthly: 'prod_TIVZkP1d3cXqk5',
      premiumYearly: 'prod_TIVZ0Ir9GBQwzV',
    };

    const prices: any = {};

    for (const [key, productId] of Object.entries(productIds)) {
      const priceList = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 1,
      });

      if (priceList.data.length > 0) {
        prices[key] = priceList.data[0].id;
      }
    }

    return new Response(
      JSON.stringify(prices),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching prices:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});