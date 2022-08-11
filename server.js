const {
  getExpireDateFromDate
} = require('arifpay/lib/helper');
const {
  error,
  log
} = require('console');
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
const domainURL = process.env.DOMAIN;


app.use(express.static("./public"));
app.use(express.urlencoded());
app.use(express.json());


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


  const date = new Date();
  date.setMonth(10);
  const expired = getExpireDateFromDate(date);
  const data = {
    beneficiaries: [{
      accountNumber: 'account number',
      bank: 'AWINETAA',
      amount: 1500.0,
    }, ],
    cancelUrl: `${domainURL}/canceled.html`,
    errorUrl: `${domainURL}/error.html`,
    notifyUrl: `${domainURL}/webhook`,
    expireDate: expired,
    nonce: Math.floor(Math.random() * 10000).toString(),
    paymentMethods: ["CARD"],
    successUrl: `${domainURL}/success.html`,
    items: [{
      name: 'Pent House per Night',
      price: 1500.0,
      quantity: 1,
      image: "https://www.thespruce.com/thmb/0mCrVrlgAOLHm03zxtJxMd8RIwQ=/2048x1365/filters:fill(auto,1)/put-together-a-perfect-guest-room-1976987-hero-223e3e8f697e4b13b62ad4fe898d492d.jpg"
    }, ],
  };

  const session = await arifpay.checkout.create(data, {
    sandbox: true
  });
  console.log(session);
  return res.redirect(303, session.paymentUrl);
});

app.post('/api/create-checkout-session', async (req, res) => {

  try {
    const date = new Date();
    date.setMonth(10);
    const expired = getExpireDateFromDate(date);
    const data = {
      ...req.body,
      notifyUrl: `${domainURL}/webhook`,
      beneficiaries: [{
        accountNumber: '10000000000',
        bank: 'AWINETAA',
        amount: 1500,
      }, ],
      paymentMethods: ["CARD"],
      expireDate: expired,
      nonce: Math.floor(Math.random() * 10000).toString(),
    };

    const session = await arifpay.checkout.create(data, {
      sandbox: true
    });
    console.log(session);
    return res.json({
      error: false,
      data: session
    });
  } catch (err) {
    console.log(err);
    return res.json({
      error: true,
      msg: err.msg,
      data: err.error
    });
  }
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