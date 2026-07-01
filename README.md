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
- Navigate programmatically (no click needed) with goTo(name, parameters).
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

## Programmatic navigation

Use `goTo(name, parameters)` inside a route callback to change the page without requiring a user click, for example after a successful login:

```javascript
App.on('/dashboard', dashboard).setName('dash');
App.on('/login', login);

function login(req, router) {
    // ...login logic...
    router.goTo('dash'); // navigates to /dashboard
}
```

`goTo` also accepts a raw path or hash if the target route wasn't given a name, e.g. `router.goTo('/dashboard')`.

## Documentation 
- [CustumerJourneyJS project](https://antoniofregoso.github.io/customerjourney/).
- [cj-router](https://antoniofregoso.github.io/customerjourney/documentation/router/router/).
- [Get started](https://antoniofregoso.github.io/customerjourney/getting-started/).

## License
cj-router is [GPL-3.0-or-later](./LICENSE).
## Sponsor
[Become a CustumerJourney.js Sponsor](https://antoniofregoso.github.io/customerjourney/sponsor/).