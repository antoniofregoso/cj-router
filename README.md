# cj-router
Lightweight Router in vanilla javascript for the BuyerJourneyJS project.
## CustumerJourney.js
This library is part of the [CustumerJourney.js](https://customerjourney.ninja/) project. Vanilla JavaScript libraries optimized for creating sales funnels with hyper-personalized customer experience powered by artificial intelligence.
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
import { bjRouter } from  "@buyerjourney/router";
import { home, store, blog } from "./app/pages";

App = new bjRouter({ hashSensitive:true});
App.on('/', home);
App.on('#store/{product}', store);
App.on('#blog/{article}', blog);

App.run();
```

## Documentation 
- [CustumerJourneyJS project](https://customerjourney.ninja/).
- [cj-router](https://customerjourney.ninja/documentation/router/).
- [Get started](https://customerjourney.ninja/getting-started/).

## License
cj-router is [GPL-3.0-or-later](./LICENSE).
## Sponsor
[Become a CustumerJourney.js Sponsor](https://customerjourney.ninja/sponsor/).