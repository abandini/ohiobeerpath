// Dog-friendly Ohio breweries guide (/blog/dog-friendly-ohio-breweries): fifteen Ohio breweries whose own websites say
// dogs (or pets) are welcome. Every published fact is a verbatim quote with its URL and the date we checked it: the dog
// policy, any rules, and an address. Where dogs may go ("area") only restates what a quote on the card says. Never
// Facebook, Reddit, Nextdoor, Instagram, Untappd, BringFido, Yelp, news roundups, or our own D1 "Dog Friendly" tag.
// Re-check with: node scripts/verify-dog-guide.mjs
// Replaces the unsourced 2024-era post body at the same slug (its D1 row is blog_posts id 20).
export interface Source { quote: string; url: string; checked: string }
// outdoor: a quote names a patio / outdoor area / beer garden; indoor-and-outdoor: a quote says inside and out;
// taproom: a quote welcomes dogs in the taproom; unstated: the quote welcomes dogs without saying where.
export type DogArea = 'outdoor' | 'indoor-and-outdoor' | 'taproom' | 'unstated';
export interface DogPick {
  brewery: string;
  breweryId: number;     // brewerytrip.com/brewery/:id
  town: string;          // must appear (any case) in the `location` quote
  location: Source;      // an address line from the brewery's own site
  region: string;        // our grouping for the statewide list (the page says so)
  site: string;          // the brewery's own domain: every source for this brewery must be on it
  area: DogArea;
  policy: Source;        // the brewery's own sentence welcoming dogs or pets
  rules?: Source[];      // leash / where-not / other rules, in the brewery's words
}
const C = '2026-10-31';
export const DOG_GUIDE = {
  slug: 'dog-friendly-ohio-breweries',
  title: '15 Dog-Friendly Ohio Breweries Where Your Pup Is Welcome',
  excerpt: 'Fifteen Ohio breweries from Cleveland to Cincinnati that welcome dogs, each policy quoted from the brewery’s own website with the rules it posts.',
  datePublished: '2026-06-02T12:00:00.000Z', // blog_posts id 20 created_at (read from D1 2026-10-31)
  dateModified: C,
  checked: C,
  regions: ['Cleveland area', 'Akron area', 'Columbus area', 'Dayton area', 'Cincinnati area', 'Toledo', 'Southeast Ohio'],
  picks: [
    { brewery: 'Terrestrial Brewing Company', breweryId: 308, town: 'Cleveland', region: 'Cleveland area', site: 'terrestrialbrewing.com', area: 'indoor-and-outdoor',
      policy: { quote: 'We’re 100% dog-friendly inside and out, with a dedicated dog park right next door.', url: 'https://terrestrialbrewing.com/', checked: C },
      rules: [{ quote: 'Keep dogs leashed at all times', url: 'https://terrestrialbrewing.com/dogs/', checked: C },
        { quote: 'Clean up after your pup', url: 'https://terrestrialbrewing.com/dogs/', checked: C }],
      location: { quote: '7524 Father Frascati, Cleveland, OH 44102', url: 'https://terrestrialbrewing.com/contact/', checked: C } },
    { brewery: 'Forest City Brewery', breweryId: 120, town: 'Cleveland', region: 'Cleveland area', site: 'forestcitybrewery.com', area: 'unstated',
      policy: { quote: 'Dog friendly! Bring your pup on a leash, we have hydration stations.', url: 'https://www.forestcitybrewery.com/visit', checked: C },
      location: { quote: '2135 Columbus Road · Cleveland, OH 44113', url: 'https://www.forestcitybrewery.com/visit', checked: C } },
    { brewery: 'Masthead Brewing Company', breweryId: 208, town: 'Cleveland', region: 'Cleveland area', site: 'mastheadbrewingco.com', area: 'outdoor',
      policy: { quote: 'Our outdoor patio is pet friendly and open year-round!', url: 'https://www.mastheadbrewingco.com/faqs', checked: C },
      rules: [{ quote: 'Unfortunately, pets are not allowed in our main taproom. Service animals are welcome in all areas.', url: 'https://www.mastheadbrewingco.com/faqs', checked: C }],
      location: { quote: '1261 Superior Ave, Cleveland, OH 44114', url: 'https://www.mastheadbrewingco.com/faqs', checked: C } },
    { brewery: 'Hoppin’ Frog Brewing Company', breweryId: 163, town: 'Akron', region: 'Akron area', site: 'hoppinfrog.com', area: 'outdoor',
      policy: { quote: 'Yes, well-behaved dogs are allowed on our patio.', url: 'https://hoppinfrog.com/faqs/', checked: C },
      location: { quote: '1680 East Waterloo Rd. Akron, OH 44306', url: 'https://hoppinfrog.com/faqs/', checked: C } },
    { brewery: 'Missing Mountain Brewing Company', breweryId: 217, town: 'Cuyahoga Falls', region: 'Akron area', site: 'missingmountain.com', area: 'outdoor',
      policy: { quote: 'Friendly dogs kept on a short leash are always welcome on our outside patio (only service animals allowed inside taproom).', url: 'https://www.missingmountain.com/about', checked: C },
      location: { quote: '2811 Front St, Cuyahoga Falls, OH 44221', url: 'https://www.missingmountain.com/contact', checked: C } },
    { brewery: 'Endeavor Brewing Company', breweryId: 103, town: 'Columbus', region: 'Columbus area', site: 'endeavorbrewing.com', area: 'taproom',
      policy: { quote: 'DOG FRIENDLY We welcome humans and dogs at our taproom!', url: 'https://www.endeavorbrewing.com/location/', checked: C },
      rules: [{ quote: 'Enjoy a pint while giving your best friend a locally crafted dog biscuit made with spent grains from one of our brew days.', url: 'https://www.endeavorbrewing.com/location/', checked: C }],
      location: { quote: 'Endeavor Brewing Co. 909 W 5th Ave, Columbus, OH 43212', url: 'https://www.endeavorbrewing.com/location/', checked: C } },
    { brewery: 'Wolf’s Ridge Brewing', breweryId: 343, town: 'Columbus', region: 'Columbus area', site: 'wolfsridgebrewing.com', area: 'outdoor',
      policy: { quote: 'Are pets allowed? Pets are welcome on our patio only.', url: 'https://www.wolfsridgebrewing.com/taproom-main', checked: C },
      location: { quote: '215 N. 4th Street Columbus, OH 43215', url: 'https://www.wolfsridgebrewing.com/taproom-main', checked: C } },
    { brewery: 'Grove City Brewing Company', breweryId: 139, town: 'Grove City', region: 'Columbus area', site: 'grovecitybrewery.com', area: 'outdoor',
      policy: { quote: 'Are dogs allowed? Yes. Dogs are welcome on our outdoor patio', url: 'https://grovecitybrewery.com/faq/', checked: C },
      rules: [{ quote: 'Dogs are not permitted inside the restaurant, except for service animals as permitted by applicable law.', url: 'https://grovecitybrewery.com/faq/', checked: C }],
      location: { quote: '3946 Broadway Grove City, OH 43123', url: 'https://grovecitybrewery.com/contact/', checked: C } },
    { brewery: 'Eudora Brewing Company', breweryId: 106, town: 'Dayton', region: 'Dayton area', site: 'eudorabrewing.com', area: 'outdoor',
      policy: { quote: 'However, we DO allow well-behaved dogs on the patio and, if you can’t leave them on the patio with someone else, you can temporarily come inside with your pooch to order beer/food before returning to your patio seat.', url: 'https://www.eudorabrewing.com/faq', checked: C },
      rules: [{ quote: 'We aren’t legally allowed to let customers sit inside the taproom with their dogs.', url: 'https://www.eudorabrewing.com/faq', checked: C }],
      location: { quote: '3022 Wilmington Pike Dayton, OH 45429', url: 'https://www.eudorabrewing.com/faq', checked: C } },
    { brewery: 'Yellow Springs Brewery', breweryId: 348, town: 'Yellow Springs', region: 'Dayton area', site: 'yellowspringsbrewery.com', area: 'outdoor',
      policy: { quote: 'We feature monthly cask ales, a pet-friendly patio, and a rotating gallery of local art.', url: 'https://www.yellowspringsbrewery.com/locations/yellow-springs', checked: C },
      location: { quote: '305 N. Walnut Street Yellow Springs, Ohio 45387', url: 'https://www.yellowspringsbrewery.com/locations/yellow-springs', checked: C } },
    { brewery: 'Fifty West Brewing Company', breweryId: 113, town: 'Cincinnati', region: 'Cincinnati area', site: 'fiftywestbrew.com', area: 'outdoor',
      policy: { quote: 'Yes! Well-behaved dogs on leashes are welcome in our outdoor areas.', url: 'https://www.fiftywestbrew.com/locations', checked: C },
      rules: [{ quote: 'We also have water bowls and pup cups available upon request.', url: 'https://www.fiftywestbrew.com/locations', checked: C }],
      location: { quote: 'Wooster Pike 7605 Wooster Pike, Cincinnati, OH 45227', url: 'https://www.fiftywestbrew.com/locations', checked: C } },
    { brewery: 'Brink Brewing Co.', breweryId: 54, town: 'Cincinnati', region: 'Cincinnati area', site: 'brinkbrewing.com', area: 'outdoor',
      policy: { quote: 'Well-behaved dogs are welcome only on our patio.', url: 'https://www.brinkbrewing.com/faqs', checked: C },
      rules: [{ quote: 'The staff reserves the right to ask any disruptive dogs, children, and/or their families to leave the premises.', url: 'https://www.brinkbrewing.com/faqs', checked: C }],
      location: { quote: '5905 Hamilton Ave. Cincinnati, OH 45224', url: 'https://www.brinkbrewing.com/faqs', checked: C } },
    { brewery: 'MadTree Brewing (Oakley Taproom)', breweryId: 2382, town: 'Cincinnati', region: 'Cincinnati area', site: 'madtree.com', area: 'unstated',
      policy: { quote: 'Family friendly and dogs welcome', url: 'https://madtree.com/locations/oakley-taproom/', checked: C },
      location: { quote: '3301 Madison Road Cincinnati, OH 45209', url: 'https://madtree.com/locations/oakley-taproom/', checked: C } },
    { brewery: 'Patron Saints Brewery', breweryId: 2404, town: 'Toledo', region: 'Toledo', site: 'patronsaintsbrewery.com', area: 'taproom',
      policy: { quote: 'Come enjoy pints and tasters in our Heavenly taproom which is "1/2 pint" and "little growler" friendly (aka kids & dogs).', url: 'https://www.patronsaintsbrewery.com/', checked: C },
      location: { quote: '4730 W. Bancroft St. #8 Toledo, OH 43615', url: 'https://www.patronsaintsbrewery.com/', checked: C } },
    { brewery: 'Jackie O’s Taproom & Brewery', breweryId: 179, town: 'Athens', region: 'Southeast Ohio', site: 'jackieos.com', area: 'outdoor',
      policy: { quote: 'Pets are welcome at our Taproom patio and our Columbus On Fourth patio ONLY.', url: 'https://jackieos.com/faqs/', checked: C },
      rules: [{ quote: 'Dogs must be on a leash at all times and remain at your table.', url: 'https://jackieos.com/faqs/', checked: C }],
      location: { quote: 'Taproom and Brewery 25 Campbell St. Athens, OH 45701', url: 'https://jackieos.com/faqs/', checked: C } },
  ] as DogPick[],
};
export const sourcesOf = (p: DogPick): Source[] => [p.policy, ...(p.rules || []), p.location];
