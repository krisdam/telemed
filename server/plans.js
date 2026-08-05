const PLANS = {
  pay_per_visit: {
    label: 'Pay-per-visit',
    monthly_price_cents: 0,
    visit_price_cents: 7500,
    included_visits: 0,
    priority_scheduling: false,
  },
  member: {
    label: 'Member',
    monthly_price_cents: 1900,
    visit_price_cents: 4500,
    included_visits: 2,
    priority_scheduling: true,
  },
  member_plus: {
    label: 'Member+',
    monthly_price_cents: 3900,
    visit_price_cents: 3500,
    included_visits: 5,
    priority_scheduling: true,
  },
};

module.exports = { PLANS };
