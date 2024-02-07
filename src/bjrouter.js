import {Utils, ArgumentNotFoundError as ArgNotFound, ArgumentTypeError as ArgTypeError } from "./utils.js";


export class bjRouter {

    notFoundHandler = null;
    store = null;
    dispatch = null;

    /**
     * 
     * @param {Object} options 
     *  @param {boolean} [optioms.hashSensitive=false] - If set to true the router will respond to the #hashe in the urls
     *  @param {boolean} [options.caseInsensitive=true] - If set to false, uri matching will be case sensitive.
     */
    constructor(options){
        this.routes = [];
        this.default = {
            hashSensitive: false,
            caseInsensitive: true,
        };
        this.config = {...this.default,...options}; 
         
       
    };

    /**
     * Th on  method is used in assigning routes to your application
     * @method
     * @param {string} uri - uri route to be matched
     * @param {function} callback callback a callback function to be invoked if the route has been matched.
     * @returns 
     */
    on(uri, callback){        
        if(!Utils.isSet(uri)) throw new ArgNotFound("uri")
        if(!Utils.isSet(callback)) throw new ArgNotFound("callback");

        if(!Utils.isString(uri)) throw new ArgTypeError("uri", "string", uri);
        if(!Utils.isFunction(callback)) throw new ArgTypeError("callback", "function", callback);


        let route = {
            uri: null,
            callback: null,
            parameters: null,
            regExp: null,
            name: null,
            current: false
        }
        if(this._caseInsensitive) {
            uri = uri.toLowerCase()
        };  
        uri = uri.startsWith("/") ? uri : `/${uri}`;    
        this.routes.forEach(route=>{
            if(route.uri === uri) throw new Error(`the uri ${route.uri} already exists`);
        });
        
        route.uri = uri;
        route.callback = callback;
        route.parameters = this.#proccessParameters(route);
        this.routes.push(route);
        return this;
    }

    /**
     * @method
     * @param {function} page - Callback function to render on error 404
     */
    onNotFound(page){
        if(typeof page !== "function") throw new TypeError('typeof callback must be a function'); 
        this.notFoundHandler = page;
    }

    setContext(props,context={}){
        if (props!=undefined){
            props.context = context;
        }else {
            props = {}
            console.error('router.setContext error: There are no props to assign context. Review the data that you send to the component.')
        }
        
        return props;
    }

    /**
     * @method
     * @param {string} page - Name of page not found
     */
    notFoundDefault(page){
        document.title = "Error 404 | Funnels Router"
        document.body.innerHTML =  /* html */`
        <h2>Sorry!</h2>
        <h1>Error 404</h1>
        <p>The page ${page} could not be found.</p>
        `
    }

    /**
     * 
     * @returns {string}  - Browser language in 3 character format
     */
    getLang(){
        if (navigator.languages != undefined) 
          return navigator.languages[0].substring(0,2)
        return navigator.language.substring(0,2)
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
     * App.init();
     * @returns Callback to render the page
     */
    route(){  
        this.routes.forEach((route)=>{
            this.#proccessRegExp(route);
        }, this);

        let found = false;
        let key = null;
        let qs = null;

        let routerObj = {
            i18n:this.getLang(),
            setContext: this.setContext,
            pathFor: (name, parameter)=>{
                return this.#pathFor(name, parameter);
            }
        }

        if (location.hash&&this.config.hashSensitive){
            let hash = location.hash;
            const i = hash.indexOf('?')
            if (hash.indexOf('?')===-1){
                key = hash;
                qs = null;
            }else{
                key = hash.substring(0,i);
                qs = hash.substring(hash.indexOf('?'),hash.length);
            }
        }else{
            key = location.pathname; 
            location.search===""?qs=null:qs=location.search;
        }
        key = key.startsWith("/") ? key : `/${key}`;
        this.routes.some(route=>{
            if(key.match(route.regExp)){
                found = true;
                let request = {};
                request.uri = key;
                qs===null?request.query=null:request.query=Object.fromEntries(new URLSearchParams(qs));
                request.params = this.#processRequestParameters(route, key);
                return route.callback.call(this, request, routerObj);
            }            
        })
        if(!found){
            let request = {}; 
            request.uri = key; 
            if (this.notFoundHandler===null){
                return this.notFoundDefault(key);
            }else{
                return this.notFoundHandler(this, key)
            }
        }
    }

    /**
     * Initialize the router and if the -hashSensitive- option is activated add the -hashchange- event
     */
    init(){  
        this.route();
        if (this.config.hashSensitive) {
            window.addEventListener('hashchange', ()=>{
                this.route();
            });
        } 

    }

        /**
         * @method
         * @param {string} name -route name
         * @example
         * App.on("/user/login", contactCallback).setName("user-login");
         * console.log(App.pathFor("user-login")) // output: /user/login
         */
    setName(name){
        if(!Utils.isSet(name)) throw new ArgNotFound("name");
        if(!Utils.isString(name)) throw new ArgTypeError("name", "string", name);

        let targetRoute = this.routes[this.routes.length - 1];
        this.routes.forEach((route)=>{
            if(route.name === name) throw new Error(`Duplicate naming. A route with name ${name} already exists`);
        })
        targetRoute.name = name;
        return this;
    }

    /**
     * @method
     * Match the uri route where a parameter name matches a regular expression. This method must be chained to the
     * ''App.on'' method.
     * @param {*} name name parameter name to match
     * @param {*} regExp regExp regular expression pattern but must be in string format, without front slashes that converts
     * it to a regExp object. E.g "0-9", "[A-Z]". See example below  
     * Special characters which you wish to escape with the backslash must be double escaped. E.g "\\\w" instead of "\w";
     * @example
     *  App.on("/{page-name}/{id}", callBackFunction).where("id","[0-9]+");
     * this route will match my-site.com/user/10, my-site.com/user/15
     * it won't match my-site.com/admin/10, my-site.com/user/login
     */ 
    where(name, regExp){
        if(!Utils.isSet(name)) throw new ArgNotFound("name");
        if(!Utils.isSet(regExp)) throw new ArgNotFound("regExp");
        if(!Utils.isString(name)) throw new ArgTypeError("name", "string", name);
        if(!Utils.isString(regExp)) throw new ArgTypeError("regExp", "string", regExp);

       let route = this.routes[this.routes.length - 1]; 

       if (route.parameters.length === 0) throw new Error(`No Parameters Found: Could not set paramater regExpression for [${route.uri}] because the route has no parameters`);
        
        regExp = regExp.replace(/\(/g,"\\(");
        regExp = regExp.replace(/\)/g,"\\)");

        regExp = `(${regExp}+)`;
        console.log('?????????????????????????????????????');
        console.log(route.parameters);
        let parameterFound = false;
        route.parameters.forEach((parameter, index)=>{
            if(parameter[name] !== undefined){
                parameterFound = true;
                parameter[name].regExp = regExp;
            }
        });

        if(!parameterFound) throw new Error(`Invalid Parameter: Could not set paramater regExpression for [${route.uri}] because the parameter [${name}] does not exist`);

        return this;

    }



    #proccessParameters(route){
        let parameters = [];
        let sn = 0;

        if(this.#containsParameter(route.uri)){
            route.uri.replace(/\{\w+\}/g,(parameter)=>{
                sn++;
                parameter.replace(/\w+/, (parameterName)=>{
                    let obj = {};
                    obj[parameterName] = {
                        sn: sn,
                        regExp: "([^\\/]+)", // catch any word except '/' forward slash
                        value: null
                    }
                    parameters.push(obj);
                });
            });
        }
        return parameters;
    }

    #containsParameter(uri){
        return uri.search(/{\w+}/g) >= 0;
    }

    #processRequestParameters(route, key){
        let routeMatched = key.match(route.regExp);
        if (!routeMatched) return;
        let param = {};
        routeMatched.forEach((value, index)=>{
            if(index !== 0){
                let key = Object.getOwnPropertyNames(route.parameters[index - 1]);
                param[key] = value;
            }
        });
        return param;
    }

    #proccessRegExp(route){
        let regExp = route.uri;
        console.log('uri: ', route.uri)
        // escape special characters
        regExp = regExp.replace(/\//g, "\\/");
        regExp = regExp.replace(/\./g, "\\.");
        regExp = regExp.replace("/", "/?");
        if(this.#containsParameter(route.uri)){
            regExp.replace(/{\w+}/g, (parameter)=>{
                let parameterName = parameter.replace("{","");
                parameterName = parameterName.replace("}","");
                route.parameters.some((i)=>{
                    if(i[parameterName] !== undefined) {
                        regExp = regExp.replace(parameter, i[parameterName].regExp)
                        return regExp;
                    }
                });
                return parameter;
            });
        }
        regExp = `^${regExp}$`;
        route.regExp = new RegExp(regExp);
        return route;
    }

    #pathFor(name, parameters = {}){
        if(!Utils.isSet(name)) throw new ArgNotFound("name");
        if(!Utils.isString(name)) throw new ArgTypeError("name", "string", string);
        if(Utils.isEmpty(name)) throw new TypeError("name cannot be empty");
        let nameFound = false;
        let uri;
        this.routes.some(route=>{
            if(route.name === name){
                nameFound = true;
                uri = route.uri;
                if(this.#containsParameter(uri)){
                    
                    if(!Utils.isSet(parameters)) throw new ArgNotFound("parameters");
                    if(!Utils.isObject(parameters)) throw new ArgTypeError("parameters", "object", parameters);
                    if(Utils.isEmpty(parameters)) throw new TypeError("parameters cannot be empty");
                    let array  = [];
                    for(let value of route.uri.match(/\{(\w+)\}/g)){
                        value = value.replace("{","");
                        value = value.replace("}","");
                        array.push(value);
                    }
                    if(array.length !== Object.getOwnPropertyNames(parameters).length) throw new Error(`The route with name [${name}] contains ${array.length} parameters. ${Object.getOwnPropertyNames(parameters).length} given`)
                    for(let parameter in parameters){
                        if (!array.includes(parameter)) throw new Error(`Invalid parameter name [${parameter}]`);
                        let r = new RegExp(`{${parameter}}`,"g");
                        uri = uri.replace(r, parameters[parameter]);
                    }
                }
            }else{
                uri = false;
            }
        });
        return uri;
    }

    
}