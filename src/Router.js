/**
 * Router 1.4.3
 * Lightweight router in vanilla javascript for the CustomerJourneyJS project

 * Copyright (c) 2026-present, Antonio Fregoso.
 *
 * Released on: 2024-06-01
 * License: GNU General Public License v3.0
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 *
 * This program is free software: you can redistribute it and/or modify
 */

import { Utils, ArgumentNotFoundError as ArgNotFound, ArgumentTypeError as ArgTypeError } from "./utils.js";


export class Router {

    notFoundHandler = null;
    store = null;
    dispatch = null;

    /**
     * 
     * @param {Object} options 
     *  @param {boolean} [optioms.hashSensitive=false] - If set to true the router will respond to the #hashe in the urls
     *  @param {boolean} [options.caseInsensitive=true] - If set to false, uri matching will be case sensitive.
     * @example
     * const App = new bjRouter({hashSensitive:true});
     */
    constructor(options) {
        this.routes = [];
        this.default = {
            hashSensitive: false,
            caseInsensitive: true,
            basePath: '',
        };
        this.config = { ...this.default, ...options };
    };

    /**
     * Th on  method is used in assigning routes to your application
     * @method
     * @param {string} uri - uri route to be matched
     * @param {function} callback callback a callback function to be invoked if the route has been matched.
     * @example
     * App.on('/', home);
     * App.on('/#blog', blog);
     */
    on(uri, callback) {
        if (!Utils.isSet(uri)) throw new ArgNotFound("uri")
        if (!Utils.isSet(callback)) throw new ArgNotFound("callback");

        if (!Utils.isString(uri)) throw new ArgTypeError("uri", "string", uri);
        if (!Utils.isFunction(callback)) throw new ArgTypeError("callback", "function", callback);


        let route = {
            uri: null,
            callback: null,
            parameters: null,
            regExp: null,
            name: null,
            current: false
        }
        if (this.config.caseInsensitive) {
            uri = uri.toLowerCase()
        };
        uri = uri.startsWith("/") ? uri : `/${uri}`;
        this.routes.forEach(route => {
            if (route.uri === uri) throw new Error(`the uri ${route.uri} already exists`);
        });
        route.uri = uri;
        route.callback = callback;
        route.parameters = this.#proccessParameters(route);
        this.routes.push(route);
        return this;
    }

    /**
     * By default bjRouter generates a 404 error page, but it can be customized by a Callback function passed to App.onNotFound.
     * @method
     * @param {function} page - Callback function to render on error 404
     * @example
     * App.onNotFound(notFound);
     */
    onNotFound(page) {
        if (typeof page !== "function") throw new TypeError('typeof callback must be a function');
        this.notFoundHandler = page;
    }



    /**
     * @method
     * @param {string} url - Name of page not found
     */
    notFoundDefault(url) {
        document.title = "Error 404 | Funnels Router"
        document.body.innerHTML =  /* html */`
        <h2>Sorry!</h2>
        <h1>Error 404</h1>
        <p>The page ${url} could not be found.</p>
        `
    }



    /**
     * @method
     * Create the routing table as an array
     * @example
     * const App = new bjRouter({hashSensitive:true});
     * App.on("/", homeCallback);
     * App.on("/about", aboutCallback).setName("about");
     * App.on("/contact", contactCallback).setName("contact");
     * App.on.notFoundHandler(myNotFoundHandler);
     * App.run();
     */
    route() {
        this.routes.forEach((route) => {
            this.#proccessRegExp(route);
        }, this);

        let found = false;
        let key = null;
        let qs = null;

        let routerObj = {
            pathFor: (name, parameter) => {
                return this.pathFor(name, parameter);
            }
        }

        if (location.hash && this.config.hashSensitive) {
            let hash = location.hash;
            const i = hash.indexOf('?')
            if (hash.indexOf('?') === -1) {
                key = hash;
                qs = null;
            } else {
                key = hash.substring(0, i);
                qs = hash.substring(hash.indexOf('?'), hash.length);
            }
        } else {
            key = location.pathname;
            if (this.config.basePath && key.startsWith(this.config.basePath)) {
                key = key.substring(this.config.basePath.length);
                if (key === '') key = '/';
            }
            location.search === "" ? qs = null : qs = location.search;
        }
        key = key.startsWith("/") ? key : `/${key}`;
        this.routes.some(route => {
            if (key.match(route.regExp)) {
                found = true;
                let request = {};
                request.hostname = window.location.hostname
                request.pathname = key;
                request.referrer = document.referrer;
                qs === null ? request.query = null : request.query = Object.fromEntries(new URLSearchParams(qs));
                request.params = this.#processRequestParameters(route, key);
                return route.callback.call(this, request, routerObj);
            }
        })
        if (!found) {
            let request = {};
            request.uri = key;
            if (this.notFoundHandler === null) {
                return this.notFoundDefault(key);
            } else {
                return this.notFoundHandler(key)
            }
        }
    }

    /**
     * Initialize the router and if the -hashSensitive- option is activated add the -hashchange- event
     */
    run() {
        this.route();
        if (this.config.hashSensitive) {
            window.addEventListener('hashchange', () => {
                this.route();
            });
        } else {
            this.#bindLinks();
            window.addEventListener('popstate', () => {
                this.route();
            });
        }

    }

    /**
     * @method
     * @param {string} name -route name
     * @example     * 
     * const App = new bjRouter();
     * App.on("/user/login", Callback).setName("user-login");
     * ....
     * function Callback(req, router){
     *  console.log(App.pathFor("user-login")) // output: /user/login
     * }
     */
    setName(name) {
        if (!Utils.isSet(name)) throw new ArgNotFound("name");
        if (!Utils.isString(name)) throw new ArgTypeError("name", "string", name);

        let targetRoute = this.routes[this.routes.length - 1];
        this.routes.forEach((route) => {
            if (route.name === name) throw new Error(`Duplicate naming. A route with name ${name} already exists`);
        })
        targetRoute.name = name;
        return this;
    }

    /**
     * 
     * @param {*} name 
     * @param {*} parameters 
     * @example
     * App.on("/user/home", homeCallback).setName("user-home");
     * App.on("/user/login", loginCallback).setName("user-login");
     * ....
     * function loginCallback(req, router){
     *  onsole.log(router.pathFor("user-home")) // outputs: /user/home
     *  console.log(router.pathFor("user-login")) // outputs: /user/login
     * }
     */
    pathFor(name, parameters = {}) {
        if (!Utils.isSet(name)) throw new ArgNotFound("name");
        if (!Utils.isString(name)) throw new ArgTypeError("name", "string", string);
        if (Utils.isEmpty(name)) throw new TypeError("name cannot be empty");
        let nameFound = false;
        let uri;
        this.routes.some(route => {
            if (route.name === name) {
                nameFound = true;
                uri = route.uri;
                if (this.#containsParameter(uri)) {

                    if (!Utils.isSet(parameters)) throw new ArgNotFound("parameters");
                    if (!Utils.isObject(parameters)) throw new ArgTypeError("parameters", "object", parameters);
                    if (Utils.isEmpty(parameters)) throw new TypeError("parameters cannot be empty");
                    let array = [];
                    for (let value of route.uri.match(/[{](\w+)[}]/g)) {
                        value = value.replace("{", "");
                        value = value.replace("}", "");
                        array.push(value);
                    }
                    if (array.length !== Object.getOwnPropertyNames(parameters).length) throw new Error(`The route with name [${name}] contains ${array.length} parameters. ${Object.getOwnPropertyNames(parameters).length} given`)
                    for (let parameter in parameters) {
                        if (!array.includes(parameter)) throw new Error(`Invalid parameter name [${parameter}]`);
                        let r = new RegExp(`{${parameter}}`, "g");
                        uri = uri.replace(r, parameters[parameter]);
                    }
                }
            } else {
                uri = false;
            }
        });
        return uri;
    }



    #proccessParameters(route) {
        let parameters = [];
        let sn = 0;

        if (this.#containsParameter(route.uri)) {
            // Extrae todos los {parametro} de forma segura
            const matches = route.uri.match(/[{]\w+[}]/g) || [];

            matches.forEach((parameter) => {
                sn++;
                // Limpiamos las llaves para quedarnos solo con el nombre
                const parameterName = parameter.replace('{', '').replace('}', '');
                let obj = {};
                obj[parameterName] = {
                    sn: sn,
                    regExp: "([^\\/]+)", // captura cualquier cosa menos '/'
                    value: null
                };
                parameters.push(obj);
            });
        }
        return parameters;
    }

    #containsParameter(uri) {
        return /[{]\w+[}]/g.test(uri);
    }

    #processRequestParameters(route, key) {
        let routeMatched = key.match(route.regExp);
        if (!routeMatched) return;
        let param = {};
        routeMatched.forEach((value, index) => {
            if (index !== 0) {
                let key = Object.getOwnPropertyNames(route.parameters[index - 1]);
                param[key] = value;
            }
        });
        return param;
    }

    #proccessRegExp(route) {
        let regExp = route.uri;
        // 1. Escapar caracteres especiales de URL
        regExp = regExp.replace(/\./g, "\\.");
        regExp = regExp.replace(/\//g, "\\/");

        // Hacer que la primera barra sea opcional si es necesario
        if (regExp.startsWith("\\/")) {
            regExp = "\\/?" + regExp.substring(2);
        }

        // 2. Reemplazar los parámetros {area} por la regex de captura ([^\/]+)
        if (this.#containsParameter(route.uri)) {
            route.parameters.forEach((paramObj) => {
                const parameterName = Object.keys(paramObj)[0];
                // Buscamos '{nombre}' de forma segura en el string
                const target = `{${parameterName}}`;

                // Reemplazamos textualmente '{area}' por '([^\/]+)'
                while (regExp.includes(target)) {
                    regExp = regExp.replace(target, paramObj[parameterName].regExp);
                }
            });
        }

        // 3. Delimitar el inicio y el fin de la ruta
        regExp = `^${regExp}\\/?$`;

        let flags = this.config.caseInsensitive ? "i" : "";
        route.regExp = new RegExp(regExp, flags);
        return route;
    }
    // 4. Intercepta los clics en elementos <a> para manejar la navegación internamente sin recargar la página. Solo intercepta enlaces que no tengan un atributo target y que no sean enlaces externos, anclas o enlaces de correo/teléfono.
    #bindLinks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link || link.getAttribute('target')) return;
            const href = link.getAttribute('href');
            if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                return;
            }
            e.preventDefault();
            window.history.pushState({}, '', href);
            this.route();
        });
    }

}