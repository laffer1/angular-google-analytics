/**
 * UMC Angular Google Analytics - Easy tracking for your AngularJS application
 * @version v0.3.0 - 2017-03-15
 * @link http://github.com/laffer1/angular-google-analytics
 * @author Julien Bouquillon <julien@revolunet.com>,Luke Palnau <lpalnau@umich.edu>,Lucas Holt <lholt@umich.edu>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
/* global angular, console */

angular.module('umc-angular-google-analytics', [])
    .provider('Analytics', function () {
        'use strict';

        var trackRoutes = true;
        var trackPrefix = '';
        var domainName;
        var filename = 'analytics.js';
        var pageEvent = '$routeChangeSuccess';

        this.trackers = [];
        this.pixelCode = '';
        this._logs = [];

        // config methods
        this.setAccount = function (id) {
            var primary = {
                code: id,
                name: '',
                trackEcommerce: false,
                ecommerceLoaded: false,
                trackDisplayfeatures: false,
                displayfeaturesLoaded: false,
                trackEnhancedEcommerce: false,
                enhancedEcommerceLoaded: false
            };

            // first tracker in array is always the "account" value
            if (this.trackers.length === 0) {
                this.trackers.push(primary);
            } else {
                this.trackers[0] = primary;
            }
            return true;
        };

        this.trackPages = function (doTrack) {
            trackRoutes = doTrack;
            return true;
        };

        this.trackPrefix = function (prefix) {
            trackPrefix = prefix;
            return true;
        };

        this.setDomainName = function (domain) {
            domainName = domain;
            return true;
        };

        this.setFilename = function (name) {
            filename = name;
            return true;
        };

        this.setPageEvent = function (name) {
            pageEvent = name;
            return true;
        };

        this.trackEcommerce = function (doTrack, name) {
            if (typeof name === 'undefined' || name === null || name === '') {
                this.trackers[0].trackEcommerce = doTrack;
                return doTrack;
            }

            for (var i = 1; i < this.trackers.length; i++) {
                if (this.trackers[i].name === name) {
                    this.trackers[i].trackEcommerce = doTrack;
                    return doTrack;
                }
            }

            return false;
        };

        this.trackEnhancedEcommerce = function (doTrack, name) {
            if (typeof name === 'undefined' || name === null || name === '') {
                this.trackers[0].trackEnhancedEcommerce = doTrack;
                return doTrack;
            }

            for (var i = 1; i < this.trackers.length; i++) {
                if (this.trackers[i].name === name) {
                    this.trackers[i].trackEnhancedEcommerce = doTrack;
                    return doTrack;
                }
            }

            return false;
        };

        this.trackDisplayFeatures = function (doTrack, name) {
            if (typeof name === 'undefined' || name === null || name === '') {
                this.trackers[0].trackDisplayfeatures = doTrack;
                return doTrack;
            }

            for (var i = 1; i < this.trackers.length; i++) {
                if (this.trackers[i].name === name) {
                    this.trackers[i].trackDisplayfeatures = doTrack;
                    return doTrack;
                }
            }
            return false;
        };

        /**
         * Add Facebook Pixel tracker.
         * @param code
         */
        this.addPixelTracker = function(code) {
            this.pixelCode = code;
        };

        this.addTracker = function (code, name) {
            // handle special case of primary tracker
            if (typeof name === 'undefined' || name === null || name === '') {
                this.trackers[0].code = code;
                return;
            }

            for (var i = 1; i < this.trackers.length; i++) {
                if (this.trackers[i].name === name) {
                    this.trackers[i].code = code;
                    return;
                }
            }

            this.trackers.push({
                code: code,
                name: name,
                trackEcommerce: false,
                ecommerceLoaded: false,
                trackDisplayfeatures: false,
                displayfeaturesLoaded: false,
                trackEnhancedEcommerce: false,
                enhancedEcommerceLoaded: false
            });
        };

        this.getTrackers = function () {
            return this.trackers;
        };

        // public service
        this.$get = ['$document', '$rootScope', '$location', '$window', function ($document, $rootScope, $location, $window) {
            // private methods
            this._createScriptTag = function () {
                //require a tracking id
                if (this.trackers.length === 0)
                    return;

                //initialize the window object __gaTracker
                $window.GoogleAnalyticsObject = '__gaTracker';
                if (angular.isUndefined($window.__gaTracker)) {
                    $window.__gaTracker = function () {
                        if (angular.isUndefined($window.__gaTracker.q)) {
                            $window.__gaTracker.q = [];
                        }
                        $window.__gaTracker.q.push(arguments);
                    };
                    $window.__gaTracker.l = 1 * new Date();
                }
                var opts = {};
                if (domainName) {
                    opts.cookieDomain = domainName;
                }

                // create the primary tracker
                $window.__gaTracker('create', this.trackers[0].code);

                // create secondary trackers if present
                for (var i = 1; i < this.trackers.length; i++) {
                    $window.__gaTracker('create', this.trackers[i].code, {'name': this.trackers[i].name});
                }

                this._loadDisplayFeatures();
                this._loadEcommerce();
                this._loadEnhancedEcommerce();

                if (trackRoutes) {
                    // TODO: this is too specific to our apps
                    this._trackPage($location.path(), $rootScope.pageTitle);
                }

                // inject the google analytics tag
                (function () {
                    if (angular.isUndefined($document[0]))
                        return;

                    var gaTag = $document[0].createElement('script');
                    gaTag.type = 'text/javascript';
                    gaTag.async = true;
                    gaTag.src = '//www.google-analytics.com/' + filename;
                    var s = $document[0].getElementsByTagName('script')[0];
                    s.parentNode.insertBefore(gaTag, s);
                })();
            };

            /**
             * Create a Facebook pixel script tag.
             * @private
             */
            this._createPixelScriptTag = function () {
                if (angular.isUndefined(this) || this.pixelCode === '')
                    return;

                // inject the google analytics tag
                (function (pixelCode) {
                    if (angular.isUndefined($document[0]))
                        return;

                    // Facebook Pixel Code
                    !(function (f, b, e, v, n, t, s) {
                        if (f.fbq)
                            return;
                        n = f.fbq = function () {
                            n.callMethod ?
                                n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                        };
                        if (!f._fbq)
                            f._fbq = n;
                        n.push = n;
                        n.loaded = !0;
                        n.version = '2.0';
                        n.queue = [];
                        t = b.createElement(e);
                        t.async = !0;
                        t.src = v;
                        s = b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t, s);
                        $window.pixel = f;
                    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js'));

                    $window.pixel.fbq('init', pixelCode);
                })();

                this._trackPixelPage();
            };

            /**
             * Track pixel page view
             * @private
             */
            this._trackPixelPage = function() {
                this._trackPixel('PageView');
            };

            /**
             * Track facebook pixel events.
             *
             * @param action ViewContent, Search, AddToCart, etc.
             * @param data
             * @private
             */
            this._trackPixel = function(action, data) {
                if (angular.isUndefined($window.pixel)) {
                    return;
                }

                if (angular.isUndefined(data)) {
                    $window.pixel.fbq('track', action);
                } else {
                    $window.pixel.fbq('track', action, data);
                }

                this._log('pixel-' + action, data);
            };

            // for testing
            this._log = function () {
                this._logs.push(arguments);
            };

            this._loadDisplayFeatures = function () {
                // load display features
                if (this.trackers[0].trackDisplayfeatures && !this.trackers[0].displayfeaturesLoaded) {
                    this.trackers[0].displayfeaturesLoaded = true;
                    $window.__gaTracker('require', 'displayfeatures', 'displayfeatures.js');
                    this._log('loadGA', 'displayfeatures');
                }
                for (var d = 1; d < this.trackers.length; d++) {
                    if (this.trackers[d].displayfeaturesLoaded)
                        continue;
                    this.trackers[d].displayfeaturesLoaded = true;
                    $window.__gaTracker(this.trackers[d].name + '.require', 'displayfeatures', 'displayfeatures.js');
                    this._log('loadGA', 'displayfeatures ' + this.trackers[d].name);
                }
            };

            /**
             * Load ecommerce plugin if enabled.
             * @private
             */
            this._loadEcommerce = function () {
                // load ecommerce for each tracker if requested
                // Only enable ecommerce if enhanced ecommerce is disabled per Google documentation.
                if (this.trackers[0].trackEcommerce && !this.trackers[0].ecommerceLoaded && !this.trackers[0].trackEnhancedEcommerce) {
                    this.trackers[0].ecommerceLoaded = true;
                    $window.__gaTracker('require', 'ecommerce', 'ecommerce.js');
                    this._log('loadGA', 'ecommerce');
                }
                for (var e = 1; e < this.trackers.length; e++) {
                    if (this.trackers[e].ecommerceLoaded)
                        continue;
                    this.trackers[e].ecommerceLoaded = true;
                    $window.__gaTracker(this.trackers[e].name + '.require', 'ecommerce', 'ecommerce.js');
                    this._log('loadGA', 'ecommerce ' + this.trackers[e].name);
                }
            };

            this._loadEnhancedEcommerce = function () {
                // load enhanced ecommerce for each tracker if requested
                // Only enable ecommerce if enhanced ecommerce is disabled per Google documentation.
                if (this.trackers[0].trackEnhancedEcommerce && !this.trackers[0].enhancedEcommerceLoaded) {
                    this.trackers[0].enhancedEcommerceLoaded = true;
                    $window.__gaTracker('require', 'ec', 'ec.js');
                    this._log('loadGA', 'ec');
                }
                for (var ee = 1; ee < this.trackers.length; ee++) {
                    if (this.trackers[ee].enhancedEcommerceLoaded)
                        continue;
                    this.trackers[ee].enhancedEcommerceLoaded = true;
                    $window.__gaTracker(this.trackers[ee].name + '.require', 'ec', 'ec.js');
                    this._log('loadGA', 'ec ' + this.trackers[ee].name);
                }
            };

            /**
             * Track Pageview
             * https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#hit
             * @param url (optional, if not specified $location.path() will be used, and this gets the trackPrefix prefixed onto it)
             * @param title (optional, if not specified $rootScope.pageTitle will be used if defined, else let GA use the document.title property)
             * @private
             */
            this._trackPage = function (url, title) {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                this._loadDisplayFeatures();

                if (angular.isUndefined(url)) {
                    url = $location.path();
                }

                var fullUrl = trackPrefix + url;
                // page should always start with a /
                if (fullUrl !== '' && fullUrl.charAt(0) !== '/') {
                    fullUrl = '/' + fullUrl;
                }

                var opts = {
                    'page': fullUrl
                };

                if (angular.isUndefined(title) && angular.isDefined($rootScope.pageTitle)) {
                    title = $rootScope.pageTitle;
                }
                if (angular.isDefined(title) && title !== '') {
                    opts.title = title;
                }

                // primary
                $window.__gaTracker('send', 'pageview', opts);
                // secondary trackers
                for (var x = 1; x < this.trackers.length; x++) {
                    $window.__gaTracker(this.trackers[x].name + '.send', 'pageview', opts);
                }
                this._log('pageview', arguments);
            };

            /**
             * Track Event
             * https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#events
             * @param category
             * @param action
             * @param label
             * @param value
             * @private
             */
            this._trackEvent = function (category, action, label, value) {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                // these two are required by Google's API
                var evt = {
                    'eventCategory': category,
                    'eventAction': action
                };

                // label is optional and a string
                if (typeof label !== 'undefined') {
                    evt.eventLabel = label;
                }

                // value is optional and numeric
                if (typeof value !== 'undefined') {
                    // if value is not numeric, just default it to zero
                    if (!isNaN(parseFloat(value)) && isFinite(value)) {
                        value = 0;
                    }
                    evt.eventValue = value;
                }

                // primary
                $window.__gaTracker('send', 'event', evt);

                // secondary trackers
                for (var x = 1; x < this.trackers.length; x++) {
                    $window.__gaTracker(this.trackers[x].name + '.send', 'event', evt);
                }
                this._log('event', arguments);
            };

            /**
             * Add enhanced ecommerce impression
             *
             * @param id  product id  (string)        required
             * @param name  product name (string)     required
             * @param category product category (string)
             * @param brand  product brand (string)
             * @param variant product variant (string)
             * @param list  product list (string)
             * @param position  product position (number)
             * @param dimension1 custom dimension (string)
             * @param price price of the product (currency)
             * @private
             */
            this._addImpression = function (id, name, category, brand, variant, list, position, dimension1, price) {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                this._loadEnhancedEcommerce();

                var impression = {
                    'id': id,
                    'name': name,
                    'category': category,
                    'brand': brand,
                    'variant': variant,
                    'list': list,
                    'position': position,
                    'dimension1': dimension1,
                    'price': price
                };

                if (this.trackers[0].trackEnhancedEcommerce) {
                    $window.__gaTracker('ec:addImpression', impression);
                    this._log('ec:addImpression', arguments);
                }

                for (var x = 1; x < this.trackers.length; x++) {
                    if (this.trackers[x].trackEnhancedEcommerce) {
                        $window.__gaTracker(this.trackers[x].name + '.ec:addImpression', impression);
                        this._log('ec:addImpression', arguments);
                    }
                }
            };

            /**
             * Add enhanced ecommerce product
             *
             * @param id  product id  (string)        required
             * @param name  product name (string)     required
             * @param category product category (string)
             * @param brand  product brand (string)
             * @param variant product variant (string)
             * @param position  product position (number)
             * @param dimension1 custom dimension (string)
             * @param price unit price (currency)
             * @param qty quantity (int)
             * @param coupon item coupon (string)
             * @private
             */
            this._addProduct = function (id, name, category, brand, variant, position, dimension1, price, qty, coupon) {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                this._loadEnhancedEcommerce();

                var product = {
                    'id': id,
                    'name': name,
                    'category': category,
                    'brand': brand,
                    'variant': variant,
                    'position': position,
                    'dimension1': dimension1,
                    'price': price,
                    'quantity': qty,
                    'coupon': coupon
                };

                if (this.trackers[0].trackEnhancedEcommerce) {
                    $window.__gaTracker('ec:addProduct', product);
                    this._log('ec:addProduct', arguments);
                }

                for (var x = 1; x < this.trackers.length; x++) {
                    if (this.trackers[x].trackEnhancedEcommerce) {
                        $window.__gaTracker(this.trackers[x].name + '.ec:addProduct', product);
                        this._log('ec:addProduct', arguments);
                    }
                }
            };

            /**
             * Add a promotional item for enhanced ecommerce.
             *
             * Important: Do not send a promotion with product data.
             *
             * Unlike most routines, this sets the action and triggers a click event automatically. A single call
             * will send the data.
             *
             * @param id
             * @param name
             * @param creative
             * @param position
             * @private
             */
            this._addPromo = function(id, name, creative, position) {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                this._loadEnhancedEcommerce();

                var promo = {
                    'id': id,
                    'name': name,
                    'creative': creative,
                    'position': position
                };

                if (this.trackers[0].trackEnhancedEcommerce) {
                    $window.__gaTracker('ec:addPromo', promo);
                    this._log('ec:addPromo', arguments);
                }

                for (var x = 1; x < this.trackers.length; x++) {
                    if (this.trackers[x].trackEnhancedEcommerce) {
                        $window.__gaTracker(this.trackers[x].name + '.ec:addPromo', promo);
                        this._log('ec:addPromo', arguments);
                    }
                }

                this._setAction('promo_click');
                this._trackEvent('Internal Promotions', 'click', name);
            };

            /**
             * set enhanced ecommerce action
             * @param action type of event such as a 'click'
             * @param data data to send such as a {'list': 'Search Results'}
             * @private
             */
            this._setAction = function (action, data) {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                this._loadEnhancedEcommerce();

                if (this.trackers[0].trackEnhancedEcommerce) {
                    $window.__gaTracker('ec:setAction', action, data);
                    this._log('ec:setAction', arguments);
                }

                for (var x = 1; x < this.trackers.length; x++) {
                    if (this.trackers[x].trackEnhancedEcommerce) {
                        $window.__gaTracker(this.trackers[x].name + '.ec:setAction', action, data);
                        this._log('ec:setAction', arguments);
                    }
                }
            };

            /**
             * Add ecommerce transaction
             * https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce#addTrans
             * @param transactionId
             * @param affiliation
             * @param total
             * @param tax
             * @param shipping
             * @param currency (defaults to USD if not set)  ISO 4217 codes for this.
             * @private
             */
            this._addTrans = function (transactionId, affiliation, total, tax, shipping, currency) {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                this._loadEcommerce();

                if (currency == null)
                    currency = 'USD';

                var tran = {
                    'id': transactionId,
                    'affiliation': affiliation,
                    'revenue': total,
                    'shipping': shipping,
                    'tax': tax,
                    'currency': currency
                };

                if (this.trackers[0].trackEcommerce) {
                    $window.__gaTracker('ecommerce:addTransaction', tran);
                    this._log('ecommerce:addTransaction', arguments);
                }

                for (var x = 1; x < this.trackers.length; x++) {
                    if (this.trackers[x].trackEcommerce) {
                        $window.__gaTracker(this.trackers[x].name + '.ecommerce:addTransaction', tran);
                        this._log('ecommerce:addTransaction', arguments);
                    }
                }
            };

            /**
             * Add item to transaction
             * https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce#addItem
             * @param transactionId
             * @param name
             * @param sku
             * @param category
             * @param price
             * @param quantity
             * @param currency (defaults to USD if not set)  ISO 4217 codes for this.
             * @private
             */
            this._addItem = function (transactionId, name, sku, category, price, quantity, currency) {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                this._loadEcommerce();

                if (currency == null)
                    currency = 'USD';

                var item = {
                    'id': transactionId,
                    'name': name,
                    'sku': sku,
                    'category': category,
                    'price': price,
                    'quantity': quantity,
                    'currency': currency
                };

                if (this.trackers[0].trackEcommerce) {
                    $window.__gaTracker('ecommerce:addItem', item);
                    this._log('ecommerce:addItem', arguments);
                }

                for (var x = 1; x < this.trackers.length; x++) {
                    if (this.trackers[x].trackEcommerce) {
                        $window.__gaTracker(this.trackers[x].name + '.ecommerce:addItem', item);
                        this._log('ecommerce:addItem', arguments);
                    }
                }
            };

            /**
             * Track transaction
             * https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce#sendingData
             * @private
             */
            this._trackTrans = function () {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                this._loadEcommerce();

                if (this.trackers[0].trackEcommerce) {
                    $window.__gaTracker('ecommerce:send');
                    this._log('ecommerce:send', arguments);
                }

                for (var x = 1; x < this.trackers.length; x++) {
                    if (this.trackers[x].trackEcommerce) {
                        $window.__gaTracker(this.trackers[x].name + '.ecommerce:send');
                        this._log('ecommerce:send', arguments);
                    }
                }
            };

            /**
             * Clear transaction
             * https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce#clearingData
             * @private
             */
            this._clearTrans = function () {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                this._loadEcommerce();

                if (this.trackers[0].trackEcommerce) {
                    $window.__gaTracker('ecommerce:clear');
                    this._log('ecommerce:clear', arguments);
                }

                for (var x = 1; x < this.trackers.length; x++) {
                    if (this.trackers[x].trackEcommerce) {
                        $window.__gaTracker(this.trackers[x].name + '.ecommerce:clear');
                        this._log('ecommerce:clear', arguments);
                    }
                }
            };


            this._trackSocial = function (network, action, target) {
                if (angular.isUndefined($window.__gaTracker)) {
                    return;
                }

                var social = {
                    'socialNetwork': network,
                    'socialAction': action,
                    'socialTarget': target
                };

                // primary
                $window.__gaTracker('send', 'social', social);

                // secondary trackers
                for (var x = 1; x < this.trackers.length; x++) {
                    $window.__gaTracker(this.trackers[x].name + '.send', 'social', social);
                }

                this._log('trackSocial', arguments);
            };

            // --------- initialization steps -----------------------
            // creates the Google Analytics tracker
            this._createScriptTag();

            // create pixel tracker if code exists.
            this._createPixelScriptTag();

            var me = this;

            // activates page tracking
            if (trackRoutes) {
                $rootScope.$on(pageEvent, function () {
                    me._trackPage($location.path(), $rootScope.pageTitle);
                });
            }
            // --------- end initialization steps -----------------------


            // the rest of the public interface
            return {
                _logs: me._logs,
                trackers: me.trackers,
                trackPage: function (url, title) {
                    // add a page event
                    me._trackPage(url, title);
                },
                trackEvent: function (category, action, label, value) {
                    // add an action event
                    me._trackEvent(category, action, label, value);
                },
                // enhanced ecommerce
                addImpression: function (id, name, category, brand, variant, list, position, dimension1, price) {
                    me._addImpression(id, name, category, brand, variant, list, position, dimension1, price);
                },
                addProduct: function (id, name, category, brand, variant, position, dimension1, price, qty, coupon) {
                    me._addProduct(id, name, category, brand, variant, position, dimension1, price, qty, coupon);
                },
                addPromo: function(id, name, creative, position) {
                    me._addPromo(id, name, creative, position);
                },
                setAction: function (action, data) {
                    me._setAction(action, data);
                },
                // ecommerce
                addTrans: function (transactionId, affiliation, total, tax, shipping) {
                    me._addTrans(transactionId, affiliation, total, tax, shipping);
                },
                addItem: function (transactionId, sku, name, category, price, quantity) {
                    me._addItem(transactionId, name, sku, category, price, quantity);
                },
                trackTrans: function () {
                    me._trackTrans();
                },
                clearTrans: function () {
                    me._clearTrans();
                },
                trackSocial: function (network, action, target) {
                    me._trackSocial(network, action, target);
                },
                ga: function () {
                    if (angular.isDefined($window.__gaTracker)) {
                        $window.__gaTracker(arguments);
                    }
                },
                trackPixelPage: function() {
                    me._trackPixelPage();
                },
                /**
                 * The view content event should be placed on any content or product detail pages to track when people
                 * visit. Add parameters for conversion value (amount per content view) and currency to measure the
                 * value of content view conversions.
                 * @param amount
                 * @param currency
                 * @param content_ids unique array of ids
                 * @param content_type type of item, usually product
                 */
                trackPixelViewContent: function(amount, currency, content_ids, content_type) {
                    if (angular.isUndefined(currency))
                        currency = 'USD';
                    if (angular.isUndefined(amount))
                        amount = 0;
                    if (angular.isUndefined(content_type))
                        content_type = 'product';
                    me._trackPixel('ViewContent', {value: amount, currency: currency,
                            content_ids: content_ids, content_type: content_type});
                },
                /**
                 * The search event should be placed on any search results page to track when people complete a search.
                 * Add a search string parameter to track and optimize for specific search terms.
                 * @param term
                 */
                trackPixelSearch: function(term) {
                    me._trackPixel('Search', {
                        search_string: term
                    });
                },
                /**
                 * The add to cart event should be triggered when a person adds an item to a shopping cart on your
                 * website. Add parameters for conversion value (amount per content view) and currency to
                 * measure the value of add to cart conversions.
                 */
                trackPixelAddToCart: function(amount, currency, content_ids, content_type) {
                    if (angular.isUndefined(currency))
                        currency = 'USD';
                    if (angular.isUndefined(amount))
                        return;
                    if (angular.isUndefined(content_type))
                        content_type = 'product';

                    me._trackPixel('AddToCart', {
                        value: amount, currency: currency,
                        content_ids: content_ids, content_type: content_type
                    });
                },
                /**
                 * The add to wishlist event should be triggered when a person adds or saves an item to a wishlist on
                 * your website. Add parameters for conversion value (amount per content view) and currency to measure
                 * the value of add to wishlist conversions.
                 * @param amount
                 * @param currency
                 */
                trackPixelAddToWishList: function(amount, currency) {
                    if (angular.isUndefined(currency))
                        currency = 'USD';
                    if (angular.isUndefined(amount))
                        return;
                    me._trackPixel('AddToWishList', {value: amount, currency: currency});
                },
                /**
                 * The initiate checkout event should be triggered when a person enters the checkout flow on your
                 * website.
                 */
                trackPixelInitiateCheckout: function () {
                    me._trackPixel('InitiateCheckout');
                },
                /**
                 * The add payment info event should be triggered when a person adds payment information to an account
                 * or in a checkout flow.
                 */
                trackPixelAddPaymentInfo: function () {
                    me._trackPixel('AddPaymentInfo');
                },
                /**
                 * The purchase event should be placed on an order confirmation page or be triggered from a complete
                 * order button, indicating that a person has purchased a product. Add parameters for conversion value
                 * (amount per content view) and currency to measure the value of purchase conversions.
                 * @param amount
                 * @param currency
                 * @param content_ids unique id array of products
                 * @param content_type type of item (usually product)
                 */
                trackPixelPurchase: function (amount, currency, content_ids, content_type) {
                    if (angular.isUndefined(currency))
                        currency = 'USD';
                    if (angular.isUndefined(amount))
                        return;
                    if (angular.isUndefined(content_type))
                        content_type = 'product';

                    me._trackPixel('Purchase', {value: amount, currency: currency, content_type: content_type, content_ids: content_ids});
                },
                /**
                 * The lead event should be placed on a form confirmation page or triggered by a submit button when a
                 * lead form is completed (ex: when someone signs up for a newsletter). Add parameters for conversion
                 * value (amount per content view) and currency to measure the value of lead conversions.
                 * @param amount
                 * @param currency
                 */
                trackPixelLead: function (amount, currency) {
                    if (angular.isUndefined(currency))
                        currency = 'USD';
                    if (angular.isUndefined(amount))
                        return;
                    me._trackPixel('Lead', {value: amount, currency: currency});
                },
                /**
                 * The complete registration event should be placed on a registration form confirmation page or triggered
                 * by a submit button when a registration form is completed (ex: when someone subscribes to a service).
                 * Add parameters for conversion value (amount per content view) and currency to measure the value of
                 * complete registration conversions.
                 */
                trackPixelCompleteRegistration: function (amount, currency) {
                    if (angular.isUndefined(currency))
                        currency = 'USD';
                    if (angular.isUndefined(amount))
                        return;
                    me._trackPixel('CompleteRegistration', {value: amount, currency: currency});
                },
                /**
                 * Track custom events.
                 * @param name the name of the event
                 * @param data any data passed as an object {}
                 */
                trackPixelCustom: function(name, data) {
                    me._trackPixel(name, data);
                }
            };
        }];

    });
