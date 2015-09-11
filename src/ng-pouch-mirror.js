'use strict';
/* global angular, PouchDB */
/* jshint -W097 */

angular.module('pouchMirror', [])

  .run(function($window, $rootScope) {
    $rootScope.online = $window.navigator.onLine;
    $window.addEventListener("offline", function () {
      $rootScope.online = false;
      $rootScope.$broadcast('offline');
    });
    $window.addEventListener("online", function () {
      $rootScope.online = true;
      $rootScope.$broadcast('online');
    });
  })

  .factory('PouchMirror', function($rootScope, $q) {
    return function(localDbName, remoteUrl, remoteOptions) {
      var memoryDb, diskDb, remoteDb, remoteSync;
      var syncing = false;
      var stopped = true;
      var status = 'stopped';
      var active = false, ready = false;
      remoteOptions = remoteOptions || {};
      if(!localDbName) {
        localDbName = 'pouch';
      }
      // First copy the diskDb to memory, and then sync changes in memory to diskDb
      memoryDb = new PouchDB(localDbName + '_mem', {adapter: 'memory'});
      diskDb = new PouchDB(localDbName);
      diskDb.replicate.to(memoryDb).then(function() {
        memoryDb.replicate.to(diskDb, {live: true});
        startSync();
      });

      $rootScope.$on('online', function() {
        if(!stopped) {
          startSync();
        }
      });
      $rootScope.$on('offline', function() {
        if(!stopped) {
          status = 'offline';
        }
        pauseSync();
      });

      memoryDb.startSync = startSync;
      memoryDb.stopSync = stopSync;
      memoryDb.syncStatus = getStatus;
      memoryDb.destroyLocal = destroyLocal;

      return memoryDb;

      function getStatus() {
        return {
          status: status,
          active: active,
          ready: ready
        };
      }

      function startSync() {
        stopped = false;
        if(remoteUrl && $rootScope.online && !syncing) {
          if(!remoteDb) {
            remoteDb = new PouchDB(remoteUrl, remoteOptions);
          }
          remoteSync = PouchDB.sync(remoteDb, memoryDb, {live: true, retry: true})
            .on('active', function() {
              active = true;
              $rootScope.$broadcast('pm:update', localDbName, 'active', getStatus());
            })
            .on('paused', function() {
              active = false;
              if(!ready) {
                ready = true;
                $rootScope.$broadcast('pm:update', localDbName, 'ready', getStatus());
              }
              $rootScope.$broadcast('pm:update', localDbName, 'paused', getStatus());

            })
            .on('complete', function(info) {
              // This means the sync was cancelled
              active = false;
              syncing = false;
              // These should show up under the 'error' handler but PouchDB is firing 'complete' instead
              if(checkUnauthorized(info)) {
                status = 'error';
                $rootScope.$broadcast('pm:error', localDbName, {error: 'unauthorized'}, getStatus(), info);
              } else {
                status = 'stopped';
                $rootScope.$broadcast('pm:update', localDbName, 'stopped', getStatus(), info);
              }
            })
            .on('denied', function(err) {
              // Access denied
              $rootScope.$broadcast('pm:denied', localDbName, err, getStatus());
            })
            .on('error', function(err){
              active = false;
              status = 'error';
              $rootScope.$broadcast('pm:error', localDbName, err, getStatus());
            });
          syncing = true;
          status = 'syncing';
        } else {
          if (!$rootScope.online) {
            status = 'offline';
          }
          if (!ready) {
            ready = true;
            $rootScope.$broadcast('pm:update', localDbName, 'ready', getStatus());
          }
        }
      }

      // Called when an offline status is detected
      function pauseSync() {
        if(syncing) {
          remoteSync.cancel();
          syncing = false;
        }
      }

      // Manually stop the sync regardless of offline status
      function stopSync() {
        stopped = true;
        status = 'stopped';
        ready = 'false';
        pauseSync();
      }

      // Destroys both the Disk and Memory databases
      function destroyLocal() {
        stopSync();
        return $q.all([diskDb.destroy(), memoryDb.destroy()]);
      }

      function checkUnauthorized(info) {
        var unauthorized = false;
        if(info.push && info.push.errors) {
          info.push.errors.forEach(function(err) {
            if(err.name === 'unauthorized' || err.name === 'forbidden') {
              unauthorized = true;
            }
          });
        }
        if(info.pull && info.pull.errors) {
          info.pull.errors.forEach(function(err) {
            if(err.name === 'unauthorized' || err.name === 'forbidden') {
              unauthorized = true;
            }
          });
        }
        return unauthorized;
      }

    };
  });