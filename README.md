# cj-router
Lightweight Router in vanilla javascript for the BuyerJourneyJS project.
## CustumerJourney.js
This library is part of the [CustumerJourney.js](https://antoniofregoso.github.io/customerjourney/) project. Vanilla JavaScript libraries optimized for creating sales funnels with hyper-personalized customer experience powered by artificial intelligence.
## Features
- Multiple routes with path and callback function.
- Single page application routing using hash.
- Parameters.
- Query strings.
- Set name on routes with setName(name) and retrieve the path with pathFor(name, parameters).
- Error 404: Callback function included.
- Error 404: Customizable Callback function.

## Example

```javascript
import { Router } from  "@customerjourney/cj-router";
import { home, store, blog } from "./app/pages";

const App = new Router({ hashSensitive:true});
App.on('/', home);
App.on('#store/{product}', store);
App.on('#blog/{article}', blog);

App.run();
```

## Documentation 
- [CustumerJourneyJS project](https://antoniofregoso.github.io/customerjourney/).
- [cj-router](https://antoniofregoso.github.io/customerjourney/documentation/router/router/).
- [Get started](https://antoniofregoso.github.io/customerjourney/getting-started/).

## License
cj-router is [GPL-3.0-or-later](./LICENSE).
## Sponsor
[Become a CustumerJourney.js Sponsor](https://antoniofregoso.github.io/customerjourney/sponsor/).