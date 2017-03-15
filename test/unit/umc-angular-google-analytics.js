/* global module, angular, console, describe, expect, it, before, beforeEach, inject, spyOn, AnalyticsProvider */

'use strict';

describe('umc-angular-google-analytics', function(){

    beforeEach(module('umc-angular-google-analytics'));
    beforeEach(module(function (AnalyticsProvider) {
        // Google Analytics
        AnalyticsProvider.setAccount('UA-XXXXXX-xx');
        AnalyticsProvider.addTracker('UA-XXXXXX-xx', 'foo');

        AnalyticsProvider.trackEcommerce(true);
        AnalyticsProvider.trackEcommerce(true, 'foo');

        // facebook pixel
        AnalyticsProvider.addPixelTracker('12345');
    }));

   describe('automatic trackPages', function() {

      it('should inject the GA script', function() {
        inject(function(Analytics) {
          expect(document.querySelectorAll("script[src='//www.google-analytics.com/analytics.js']").length).toBe(1);
        });
      });

      it('should generate pageTracks', function() {
        inject(function(Analytics) {
          expect(Analytics._logs.length).toBe(6); //app init
          Analytics.trackPage('test');
          expect(Analytics._logs.length).toBe(7);
          Analytics.trackEvent('test');
          expect(Analytics._logs.length).toBe(8);
        });
      });

      it('should generate a trackpage to routeChangeSuccess', function() {
        inject(function(Analytics, $rootScope) {
          $rootScope.$broadcast('$routeChangeSuccess');
          expect(Analytics._logs.length).toBe(7); //app init + event
        });
      });
  });

  describe('e-commerce transactions', function() {

      it('should add transaction', function() {
        inject(function(Analytics) {
          expect(Analytics._logs.length).toBe(6);
          Analytics.addTrans('1', '', '2.42', '0.42', '0', 'Amsterdam', '', 'Netherlands');
          expect(Analytics._logs.length).toBe(8);
        });
      });

      it('should add an item to transaction', function() {
        inject(function(Analytics) {
          expect(Analytics._logs.length).toBe(6);
          Analytics.addItem('1', 'sku-1', 'Test product 1', 'Testing', '1', '1');
          expect(Analytics._logs.length).toBe(8);
          Analytics.addItem('1', 'sku-2', 'Test product 2', 'Testing', '1', '1');
          expect(Analytics._logs.length).toBe(10);
        });
      });

      it('should track the transaction', function() {
        inject(function(Analytics) {
          expect(Analytics._logs.length).toBe(6);
          Analytics.trackTrans();
          expect(Analytics._logs.length).toBe(8);
        });
      });
  });

  describe('NOT automatic trackPages', function() {
    beforeEach(module(function(AnalyticsProvider) {
      AnalyticsProvider.trackPages(false);
    }));

    it('should NOT generate an trackpage to routeChangeSuccess', function() {
      inject(function(Analytics, $rootScope) {
        $rootScope.$broadcast('$routeChangeSuccess');
        expect(Analytics._logs.length).toBe(5);
      });
    });
  });

 describe('supports legacy ga.js', function() {
    beforeEach(module(function(AnalyticsProvider) {
      AnalyticsProvider.setFilename('ga.js');
    }));

    it('should inject the GA Analytics script', function() {
      inject(function(Analytics) {
        expect(document.querySelectorAll("script[src='//www.google-analytics.com/ga.js']").length).toBe(1);
      });
    });

  });

 describe('supports arbitrary page events', function() {
    beforeEach(module(function(AnalyticsProvider) {
      AnalyticsProvider.setPageEvent('$stateChangeSuccess');
    }));

    it('should inject the Analytics script', function() {
      inject(function(Analytics, $rootScope) {
        $rootScope.$broadcast('$stateChangeSuccess');
        expect(Analytics._logs.length).toBe(7);
      });
    });

  });

    describe('enhanced e-commerce transactions', function () {
        beforeEach(module(function (AnalyticsProvider) {
            AnalyticsProvider.trackEcommerce(false);
            AnalyticsProvider.trackEcommerce(false, 'foo');

            AnalyticsProvider.trackEnhancedEcommerce(true);
            AnalyticsProvider.trackEnhancedEcommerce(true, 'foo');
        }));
        it('should add impression', function () {
            inject(function (Analytics) {
                expect(Analytics._logs.length).toBe(6);
                Analytics.addImpression('1', 'name', 'cat', 'brand', 'varient', 'list', 'position', 'dimension');
                expect(Analytics._logs.length).toBe(8);
            });
        });

        it('should add a product', function () {
            inject(function (Analytics) {
                expect(Analytics._logs.length).toBe(6);
                Analytics.addProduct('1', 'name', 'cat', 'brand', 'varient', 'position', 'dimension');
                expect(Analytics._logs.length).toBe(8);
            });
        });

        it('should set an action', function () {
            inject(function (Analytics) {
                expect(Analytics._logs.length).toBe(6);
                Analytics.setAction('click', 'foo');
                expect(Analytics._logs.length).toBe(8);
            });
        });
    });

    describe('facebook pixel', function () {
        it('should inject the pixel script', function () {
            inject(function (Analytics) {
                expect(document.querySelectorAll("script[src='https://connect.facebook.net/en_US/fbevents.js']").length).toBe(1);
            });
        });

        it('should track a page', function () {
            inject(function (Analytics) {
                expect(Analytics._logs.length).toBe(6);
                Analytics.trackPixelPage();
                expect(Analytics._logs.length).toBe(7);
            });
        });

        it('should add to cart', function () {
            inject(function (Analytics) {
                expect(Analytics._logs.length).toBe(6);
                Analytics.trackPixelAddToCart();
                expect(Analytics._logs.length).toBe(7);
            });
        });

        it('should track a search', function () {
            inject(function (Analytics) {
                expect(Analytics._logs.length).toBe(6);
                Analytics.trackPixelSearch();
                expect(Analytics._logs.length).toBe(7);
            });
        });
    });
});
