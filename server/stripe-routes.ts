import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICES: Record<string, string> = {
  solo: process.env.STRIPE_PRICE_SOLO!,
  studio: process.env.STRIPE_PRICE_STUDIO!,
  multi: process.env.STRIPE_PRICE_MULTI!,
};

// Créer une session de paiement Stripe Checkout
router.post('/api/stripe/checkout', async (req, res) => {
  try {
    const { plan, studioId, email } = req.body;
    if (!PRICES[plan]) return res.status(400).json({ error: 'Plan invalide' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      success_url: `${req.headers.origin}/super-admin?payment=success&studioId=${studioId}`,
      cancel_url: `${req.headers.origin}/super-admin?payment=cancelled`,
      metadata: { studioId, plan },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe] Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Webhook Stripe — écoute les événements de paiement
router.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      : JSON.parse(req.body.toString());
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;    // TODO: activer l'abonnement du studio en base
  }

  if (event.type === 'customer.subscription.deleted') {    // TODO: désactiver le studio en base
  }

  res.json({ received: true });
});

// Récupérer les infos d'abonnement d'un studio
router.get('/api/stripe/subscription/:studioId', async (req, res) => {
  try {
    res.json({ status: 'active', plan: 'solo' }); // TODO: lire en base
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
