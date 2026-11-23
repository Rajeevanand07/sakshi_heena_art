// Services and prices shown on the services page and in the booking form.
// Edit text and prices here; the page and the form's package list follow.

export const SERVICES = [
  {
    id: 'minimal',
    name: 'Minimal Mehndi',
    price: 'Starting at $20',
    kind: 'Everyday',
    idealFor: 'Everyday & small celebrations',
    description: 'Simple, modern and delicate designs for everyday occasions and intimate celebrations.',
  },
  {
    id: 'arabic',
    name: 'Arabic Mehndi',
    price: 'Starting at $20',
    kind: 'Everyday',
    idealFor: 'Parties & guests',
    description: 'Elegant floral patterns, flowing vines and statement designs.',
  },
  {
    id: 'festival',
    name: 'Festival Mehndi',
    price: 'Starting at $20',
    kind: 'Festival',
    idealFor: 'Karwa Chauth, Diwali, Eid, Teej',
    description: 'Special henna designs for Karwa Chauth, Diwali, Eid, Teej and other celebrations.',
  },
  {
    id: 'events',
    name: 'Mehndi Parties & Events',
    price: '$60 / hour',
    kind: 'Non-bridal package',
    idealFor: 'Weddings, family gatherings',
    description: 'Professional henna services for weddings, family gatherings and special events.',
  },
  {
    id: 'engagement',
    name: 'Engagement & Roka',
    price: 'Starting at $150',
    kind: 'Pre-wedding',
    idealFor: 'Engagement, roka, pre-wedding',
    description: 'Beautiful designs for your engagement, roka and pre-wedding celebrations.',
  },
  {
    id: 'bridal-basic',
    name: 'Basic Bridal',
    price: 'Starting at $200',
    kind: 'Bridal package',
    idealFor: 'Brides who love simplicity',
    description: 'Elegant and minimal bridal henna for brides who love simplicity.',
  },
  {
    id: 'bridal-premium',
    name: 'Premium Bridal',
    price: 'Starting at $350',
    kind: 'Bridal package',
    idealFor: 'Detailed, personal bridal look',
    description: 'Detailed bridal designs with beautiful patterns and personalized elements.',
  },
  {
    id: 'bridal-luxury',
    name: 'Luxury Bridal',
    price: 'Starting at $500',
    kind: 'Bridal package',
    idealFor: 'Full bridal artistry',
    description: 'Full bridal henna artistry with intricate detailing and customized designs.',
  },
];

export const BRIDAL_NOTE = 'All bridal packages are customized according to design preferences and coverage.';

export const BOOKING_POLICY = [
  'A $10 advance deposit is required to confirm your booking.',
  'Deposits are non-refundable.',
  'Please book in advance to secure your preferred date and time.',
  'Cancellations must be made at least 24 hours before the appointment.',
  'Free travel within Surrey, BC.',
  'Travel charges may apply for locations outside Surrey.',
  'Appointments are confirmed only after receiving the deposit.',
];

// Photos for the sideways scroller (names from photos.json). Landscape shots
// look best since the strip has a fixed height.
export const SERVICE_PHOTOS = ['photo-07', 'photo-01', 'photo-18', 'photo-11', 'photo-20', 'photo-19'];
