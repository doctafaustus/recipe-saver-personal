const User = require('../models/user');

module.exports = function(app, stripe) {

  // Test CC #: 4242424242424242
  app.post('/api/charge', /*loggedIn,*/ (req, res) => {
    console.log('/charge');
    
    User.findOne({ _id: req.session.passport.user._id }, (err, user) => {

      if (!user) return console.log('Handle no user found');

      console.log('Subscription', user.subscription);
      if (user.subscription === 'Full' || user.subscription === 'Full (Legacy)') {
        return console.log('User already has a full plan');
      }

      // Create subscription
      stripe.customers.create({
        description: `RS Customer: ${req.session.passport.user._id}`,
        source: req.body.stripeToken,
        email: req.body.stripeEmail,
        metadata: { 
          rs_id: req.session.passport.user._id,
          rs_email: req.session.passport.user.email
        }
      }, 
      (err, customer) => {
        if (err) console.log(err);
        console.log('S customer', customer);

        stripe.subscriptions.create(
          {
            customer: customer.id,
            plan: 'plan_G2H0nkuuNFs2Vd' // Normal $9 / Month
          }, 
          (err, subscription) => {
            console.log('subscription created!~', subscription);
            User.findOne({ _id: req.session.passport.user._id }, (err, user) => {
              if (err) throw err;
              user.subscription = 'Full (9/monthly)';
              user.stripeSubId = subscription.id;
              user.save((err) => {
                if (err) throw err;
                console.log(`Subscription created for ${req.session.passport.user._id}`);
                res.sendStatus(200);
              });
            });
        });
      });
    });

  });

}