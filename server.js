const {
  getExpireDateFromDate
} = require('arifpay/lib/helper');
const express = require('express');
const app = express();
const {
  resolve
} = require('path');
// Copy the .env.example in the root into a .env file in this folder
require('dotenv').config({
  path: './.env'
});

// Ensure environment variables are set.
checkEnv();

const Arifpay = require('arifpay').default;
const arifpay = new Arifpay(process.env.ARIFPAY_KEY)

app.use(express.static("./public"));
app.use(express.urlencoded());
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.get('/', (req, res) => {
  const path = resolve('./public/index.html');
  res.sendFile(path);
});

// Fetch the Checkout Session to display the JSON result on the success page
app.get('/checkout-session', async (req, res) => {
  const {
    sessionId
  } = req.query;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  res.send(session);
});

app.post('/create-checkout-session', async (req, res) => {

  const domainURL = process.env.DOMAIN;

  const date = new Date();
  date.setMonth(10);
  const expired = getExpireDateFromDate(date);
  const data = {
    beneficiaries: [{
      accountNumber: 'account number',
      bank: 'AWINETAA',
      amount: 10,
    }, ],
    cancelUrl: `${domainURL}/canceled.html`,
    errorUrl: `${domainURL}/canceled.html`,
    notifyUrl: `${domainURL}/webhook`,
    expireDate: expired,
    nonce: Math.floor(Math.random() * 10000).toString(),
    paymentMethods: [],
    successUrl: `${domainURL}/canceled.html`,
    items: [{
      name: 'Banana',
      price: 10.0,
      quantity: 1,
      image: "https://4.imimg.com/data4/KK/KK/GLADMIN-/product-8789_bananas_golden-500x500.jpg"
    }, ],
  };


  const session = await arifpay.checkout.create(data, {
    sandbox: true
  });
  console.log(session);
  return res.redirect(303, session.paymentUrl);
});

app.post('/api/create-checkout-session', async (req, res) => {
  const domainURL = process.env.DOMAIN;

  const date = new Date();
  date.setMonth(10);
  const expired = getExpireDateFromDate(date);
  const data = {
    ...req.body,
    beneficiaries: [{
      accountNumber: 'account number',
      bank: 'AWINETAA',
      amount: 10,
    }, ],
    expireDate: expired,
    nonce: Math.floor(Math.random() * 10000).toString(),
  };


  const session = await arifpay.checkout.create(data, {
    sandbox: true
  });
  console.log(session);
  return res.redirect(303, session.paymentUrl);
});

// Webhook handler for asynchronous events.
app.post('/webhook', async (req, res) => {
  const transcation = req.body
  console.log(`🔔  Payment received!`);
  console.log(transcation);
  res.sendStatus(200);
});

app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));

function checkEnv() {
  const apikey = process.env.ARIFPAY_KEY;
  const domain = process.env.DOMAIN;
  if (!apikey) {
    console.log("You must set a ARIFPAY_KEY in the environment variables. Please see the README.");
    process.exit(0);
  }
  if (!domain) {
    console.log("You must set a DOMAIN in the environment variables. Please see the README.");
    process.exit(0);
  }
}