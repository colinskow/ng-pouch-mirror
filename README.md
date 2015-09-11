# NG-Pouch-Mirror

**([Live Demo](https://superlogin-demo.herokuapp.com))**

Provides simple 3-way PouchDB sync between a remote database, memory, and disk in an AngularJS application. It will automatically cancel and restart replication when your browser goes online and offline. It keeps track of the synchronization state and broadcasts events to keep your app in the know.

For issues and feature requests visit the [issue tracker](https://github.com/colinskow/ng-pouch-mirror/issues).

## Quick Start

```js
angular.module('myApp')
  .factory('todos', function(PouchMirror){
    var db = new PouchMirror('todos', 'localhost:5984/todos');
    db.post({type: 'todo', text: 'Wash my car', complete: false});
  })
```

`db` is a reference to the in-memory db, and all changes you make will be automatically synced to the remote db, and backed up on disk. Next time you open `PouchMirror('todos' ...)` it will automatically load data from the disk into memory before starting to sync with the remote db.

## Working Example

See the [SuperLogin Demo](https://github.com/colinskow/superlogin-demo) for an example of NG-Pouch-Mirror in use.

## Offline Detection

NG-Pouch-Mirror automatically detects when your browser has no Internet connection and pauses sync if it is active. When your connection comes back, it automatically resumes sync. And if sync encounters any errors while you are online it will automatically retry using PouchDB's default exponential back-off algorithm.

When your online/offline status changes, NG-Pouch-Mirror broadcasts the `'online'` and `'offline'` events respectively through Angular's `$rootScope`.

## API

##### `new PouchMirror(localName, remoteDBUrl, remoteOptions)`
Constructs a new instance of NG-Pouch-Mirror. All arguments are optional. 

* `localName`: Used to name your memory and disk DBs. Defaults to `pouch` if not supplied.
* `remoteDBUrl`: The URL for the remote database you wish to sync with. If not supplied sync will be between disk and memory only.
* `remoteOptions`: Options that will be passed into PouchDB when your remote database is opened. See [PouchDB documentation](http://pouchdb.com/api.html#create_database) for details.

**Returns:** PouchDB instance of the memory database with the NG-Pouch-Mirror API added.

##### `db.stopSync()`
Stops sync with the remote db and won't resume until you call `db.startSync`.

##### `db.startSync()`
Resumes a sync that has been stopped. It is not necessary to call this in the beginning, because sync is started automatically if you have specified `remoteDBUrl`.

##### `db.syncStatus()`
Returns an object that contains information about the status of the sync:
- `status`: `'syncing'`, `'stopped'`, `'offline'`, or `'error'`
- `active`: `true` when the db is actively sending or receiving changes, otherwise `false`
- `ready`: `true` when the initial sync has completed, otherwise `false`

##### `db.destroyLocal()`
Stops sync and destroys both your disk and memory databases. Returns a `promise` that resolves when the dirty work is complete.

## Events

NG-Pouch-Mirror broadcasts events through Angular's `$rootScope` whenever sync status changes.

- `pm:update`: (`localName`, `action`, `syncStatus`) Sync status has changed.
- `pm:error`: (`localName`, `error`, `syncStatus`) There has been an error.
- `pm:denied`: (`localName`, `error`, `syncStatus`) CouchDB has denied a request.

`action` is `'active'` (receiving changes right now), `'ready'` (initial sync complete), `'paused'` (waiting for changes), or `'stopped'` (sync cancelled by user).

##### Example:

```js
$rootScope.$on('pm:update', function(event, localName, action, syncStatus) {
  console.log(localName + ' is now ' + action + '. Status: ' + syncStatus.status );
});
```

## Road Map

Tests are coming soon. For now it seems to work. Please report any issues [here](https://github.com/colinskow/ng-pouch-mirror/issues).

If somebody wants to write tests and do a pull request, that would be very much appreciated.

## Releases

##### Initial Release (0.1.0) 2015-09-10
NG-Pouch-Mirror was originally developed for the [SuperLogin Demo](https://github.com/colinskow/superlogin-demo) project.
