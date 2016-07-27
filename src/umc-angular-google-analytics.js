/* global angular, console */

angular.module('umc-angular-google-analytics', [])
    .provider('Analytics', function() {
        'use strict';
        
        var created = false;
        var trackRoutes = true;
        var trackPrefix = '';
        var domainName;
        var filename = 'analytics.js';
        var pageEvent = '$routeChangeSuccess';
        
        this.trackers = [];
        this._logs = [];

        // config methods
        this.setAccount = function(id) {
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
        
        this.trackPages = function(doTrack) {
            trackRoutes = doTrack;
            return true;
        };
        
        this.trackPrefix = function(prefix) {
            trackPrefix = prefix;
            return true;
        };

        this.setDomainName = function(domain) {
            domainName = domain;
            return true;
        };
        
        this.setFilename = function(name) {
            filename = name;
            return true;
        };

        this.setPageEvent = function(name) {
            pageEvent = name;
            return true;
        };

        this.trackEcommerce = function (doTrack, name) {
            if (name === null || name === '') {
                this.trackers[0].trackEcommerce = doTrack;
                return true;
            }

            for (var i = 1; i < this.trackers.length; i++) {
                if (this.trackers[i].name === name) {
                    this.trackers[i].trackEcommerce = doTrack;
                    return true;
                }
            }

            return true;
        };

        this.trackEnhancedEcommerce = function (doTrack, name) {
            if (name === null || name === '') {
                this.trackers[0].trackEnhancedEcommerce = doTrack;
                return true;
            }

            for (var i = 1; i < this.trackers.length; i++) {
                if (this.trackers[i].name === name) {
                    this.trackers[i].trackEnhancedEcommerce = doTrack;
                    return true;
                }
            }

            return true;
        };

        this.trackDisplayFeatures = function (doTrack, name) {
            if (name === null || name === '') {
                this.trackers[0].trackDisplayfeatures = doTrack;
                return true;
            }

            for (var i = 1; i < this.trackers.length; i++) {
                if (this.trackers[i].name === name) {
                    this.trackers[i].trackDisplayfeatures = doTrack;
                    return true;
                }
            }
            return true;
        };
        
        this.addTracker = function(code, name) {
            // handle special case of primary tracker
            if (name === null || name === '') {
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
        
        this.getTrackers = function() {
            return this.trackers;
        };

        // public service
        this.$get = ['$document', '$rootScope', '$location', '$window', function($document, $rootScope, $location, $window) {
          // private methods
          this._createScriptTag = function() {
            //require a tracking id
            if (this.trackers.length === 0) 
                return;

            //initialize the window object __gaTracker
            $window.GoogleAnalyticsObject = '__gaTracker';
            if (angular.isUndefined($window.__gaTracker)) {
                $window.__gaTracker = function() {
                    if (angular.isUndefined($window.__gaTracker.q)) {
                        $window.__gaTracker.q = [];
                    }
                    $window.__gaTracker.q.push(arguments);
                };
                $window.__gaTracker.l=1*new Date();
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

              // load ecommerce for each tracker if requested
              // Only enable ecommerce if enhanced ecommerce is disabled per Google documentation.
              if (this.trackers[0].trackEcommerce && !this.trackers[0].ecommerceLoaded && !this.trackers[0].trackEnhancedEcommerce) {
                  this.trackers[0].ecommerceLoaded = true;
                  $window.__gaTracker('require', 'ecommerce', 'ecommerce.js');
                  this._log('loadGA', 'ecommerce');
              }
              for (var e = 1; i < this.trackers.length; e++) {
                  if (this.trackers[e].ecommerceLoaded )
                      continue;
                  this.trackers[e].ecommerceLoaded = true;
                  $window.__gaTracker(this.trackers[e].name + '.require', 'ecommerce', 'ecommerce.js');
                  this._log('loadGA', 'ecommerce ' + this.trackers[e].name);
              }

              // load enhanced ecommerce for each tracker if requested
              // Only enable ecommerce if enhanced ecommerce is disabled per Google documentation.
              if (this.trackers[0].trackEnhancedEcommerce && !this.trackers[0].enhancedEcommerceLoaded) {
                  this.trackers[0].enhancedEcommerceLoaded = true;
                  $window.__gaTracker('require', 'ec', 'ec.js');
                  this._log('loadGA', 'ec');
              }
              for (var ee = 1; i < this.trackers.length; ee++) {
                  if (this.trackers[e].enhancedEcommerceLoaded)
                      continue;
                  this.trackers[ee].enhancedEcommerceLoaded = true;
                  $window.__gaTracker(this.trackers[ee].name + '.require', 'ec', 'ec.js');
                  this._log('loadGA', 'ec ' + this.trackers[ee].name);
              }

              // load display features
              if (this.trackers[0].trackDisplayfeatures && !this.trackers[0].displayfeaturesLoaded) {
                  this.trackers[0].displayfeaturesLoaded = true;
                  $window.__gaTracker('require', 'displayfeatures', 'displayfeatures.js');
                  this._log('loadGA', 'displayfeatures');
              }
              for (var d = 1; i < this.trackers.length; d++) {
                  if (this.trackers[e].displayfeaturesLoaded)
                      continue;
                  this.trackers[d].displayfeaturesLoaded = true;
                  $window.__gaTracker(this.trackers[d].name + '.require', 'displayfeatures', 'displayfeatures.js');
                  this._log('loadGA', 'displayfeatures ' + this.trackers[d].name);
              }

            if (trackRoutes) {
              this._trackPage($location.path(), $rootScope.pageTitle); // TODO: this is too specific to our apps
            }

            // inject the google analytics tag
            (function() {
              var gaTag = $document[0].createElement('script');
              gaTag.type = 'text/javascript';
              gaTag.async = true;
              gaTag.src = '//www.google-analytics.com/' + filename;
              var s = $document[0].getElementsByTagName('script')[0];
              s.parentNode.insertBefore(gaTag, s);
            })();
            created = true;
          };
          // for testing
          this._log = function() {
              this._logs.push(arguments);
          };

          /**
            * Track Pageview
            * https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#hit
            * @param url (optional, if not specified $location.path() will be used, and this gets the trackPrefix prefixed onto it)
            * @param title (optional, if not specified $rootScope.pageTitle will be used if defined, else let GA use the document.title property)
            * @private
            */
          this._trackPage = function(url,title) {
              if (angular.isUndefined($window.__gaTracker)) {
                  return; 
              }

              // TODO: we had the require calls here for displayfeatures. do we actually need it here?

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
              $window.__gaTracker('send','pageview', opts);
              // secondary trackers
              for (var x = 1; x < this.trackers.length; x++) {
                  $window.__gaTracker(this.trackers[x].name + '.send','pageview', opts);
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
          this._trackEvent = function(category, action, label, value) {
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
              $window.__gaTracker('send','event', evt);
              
              // secondary trackers
              for (var x = 1; x < this.trackers.length; x++) {
                  $window.__gaTracker(this.trackers[x].name + '.send','event', evt);
              }
              this._log('event', arguments);
          };

          /**
           * Add transaction
           * https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce#addTrans
           * @param transactionId
           * @param affiliation
           * @param total
           * @param tax
           * @param shipping
           * @private
           * temporarily removing city, state, country as I don't see these in the newer documentation
           */
          this._addTrans = function (transactionId, affiliation, total, tax, shipping) {
            if (angular.isUndefined($window.__gaTracker)) { return; }

            //TODO: guard in case ecommerce hasn't been loaded, shouldn't really happen

            $window.__gaTracker('ecommerce:addTransaction', {
                'id': transactionId,
                'affiliation': affiliation,
                'revenue': total,
                'shipping': shipping,
                'tax': tax
                //'city': city,
                //'state': state,
                //'country': country
            });
            this._log('ecommerce:addTransaction', arguments);
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
           * @private
           */
          this._addItem = function (transactionId, name, sku, category, price, quantity) {
              if (angular.isUndefined($window.__gaTracker)) { return; }

              $window.__gaTracker('ecommerce:addItem', {
                  'id': transactionId,
                  'name': name,
                  'sku': sku,
                  'category': category,
                  'price': price,
                  'quantity': quantity
              });
              this._log('ecommerce:addItem', arguments);
          };

          /**
           * Track transaction
           * https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce#sendingData
           * @private
           */
          this._trackTrans = function () {
              if (angular.isUndefined($window.__gaTracker)) { return; }

              $window.__gaTracker('ecommerce:send');
              this._log('ecommerce:send', arguments);
          };

          /**
           * Clear transaction
           * https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce#clearingData
           * @private
           */
          this._clearTrans = function () {
              if (angular.isUndefined($window.__gaTracker)) { return; }

              $window.__gaTracker('ecommerce:clear');
              this._log('ecommerce:clear', arguments);
          };


          this._trackSocial = function(network, action, target) {
              if (angular.isUndefined($window.__gaTracker)) {
                 return;
              }

              var social = {
                 'socialNetwork': network,
                 'socialAction': action,
                 'socialTarget': target
              };
              
              // primary
              $window.__gaTracker('send','social', social);
              
              // secondary trackers
              for (var x = 1; x < this.trackers.length; x++) {
                  $window.__gaTracker(this.trackers[x].name + '.send','social', social);
              }
              
              this._log('trackSocial', arguments);
          };

          // --------- initialization steps -----------------------
          // creates the ganalytics tracker
          this._createScriptTag();

          var me = this;

          // activates page tracking
          if (trackRoutes) {
              $rootScope.$on(pageEvent, function() {
                  me._trackPage($location.path(), $rootScope.pageTitle);
              });
          }
          // --------- end initialization steps -----------------------


          // the rest of the public interface
          return {
                _logs: me._logs,
                trackers: me.trackers,
                trackPage: function(url, title) {
                    // add a page event
                    me._trackPage(url, title);
                },
                trackEvent: function(category, action, label, value) {
                    // add an action event
                    me._trackEvent(category, action, label, value);
                },
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
                trackSocial: function(network, action, target) {
                    me._trackSocial(network, action, target);
                },
                ga: function() {
                    if (angular.isDefined($window.__gaTracker)) {
                        $window.__gaTracker(arguments);
                    }
                }
            };
        }];

    });
