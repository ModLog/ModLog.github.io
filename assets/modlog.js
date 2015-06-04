/* jshint ignore:start */

/* jshint ignore:end */

define('modlog/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'modlog/config/environment'], function (exports, Ember, Resolver, loadInitializers, config) {

  'use strict';

  var App;

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('modlog/components/ember-youtube', ['exports', 'ember', 'ember-youtube/components/ember-youtube'], function (exports, Ember, EmberYoutube) {

	'use strict';

	exports['default'] = EmberYoutube['default'];

});
define('modlog/components/profs-gradio', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    gradio: Ember['default'].inject.service(),
    classNames: 'profs-gradio'.w(),
    actions: {
      ytEnded: function ytEnded() {
        console.log('playback ended');
        this.get('gradio').playNext();
      },
      ytPlaying: function ytPlaying() {
        this.get('gradio').set('autoplay', true);
      }
    }
  });

});
define('modlog/controllers/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    gradio: Ember['default'].inject.service(),

    autoplay: Ember['default'].computed.alias('gradio.autoplay'),
    ytid: Ember['default'].computed.alias('gradio.lastUpdate.ytid'),
    queryParams: ['autoplay', 'ytid']
  });

});
define('modlog/controllers/monitor', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    modlog: Ember['default'].inject.service(),
    snoocore: Ember['default'].inject.service(),

    detectedSort: ['score:desc'],
    detected: Ember['default'].computed.sort('modlog.detected', 'detectedSort'),

    itemsToShow: 100,

    detections: (function () {
      return this.get('detected').slice(0, this.get('itemsToShow'));
    }).property('detected.@each', 'itemsToShow'),

    detectionsNotShown: Ember['default'].computed.setDiff('detected', 'detections'),

    startScanning: (function () {
      if (!this.get('snoocore.isLoggedIn')) {
        return;
      }
      this.get('modlog').scanLoop('all/new');
    }).observes('snoocore.isLoggedIn').on('init'),

    actions: {
      showMore: function showMore() {
        this.set('itemsToShow', this.get('itemsToShow') + 100);
      }
    }
  });

});
define('modlog/controllers/radio', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    gradio: Ember['default'].inject.service(),
    snoocore: Ember['default'].inject.service()
  });

});
define('modlog/controllers/scan', ['exports', 'ember', 'modlog/mixins/listing-controller'], function (exports, Ember, ListingControllerMixin) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend(ListingControllerMixin['default'], {
    limit: 5
  });

});
define('modlog/initializers/app-version', ['exports', 'modlog/config/environment', 'ember'], function (exports, config, Ember) {

  'use strict';

  var classify = Ember['default'].String.classify;
  var registered = false;

  exports['default'] = {
    name: 'App Version',
    initialize: function initialize(container, application) {
      if (!registered) {
        var appName = classify(application.toString());
        Ember['default'].libraries.register(appName, config['default'].APP.version);
        registered = true;
      }
    }
  };

});
define('modlog/initializers/ember-moment', ['exports', 'ember-moment/helpers/moment', 'ember-moment/helpers/ago', 'ember-moment/helpers/duration', 'ember'], function (exports, moment, ago, duration, Ember) {

  'use strict';

  var initialize = function initialize() {
    var registerHelper;

    if (Ember['default'].HTMLBars) {
      registerHelper = function (helperName, fn) {
        Ember['default'].HTMLBars._registerHelper(helperName, Ember['default'].HTMLBars.makeBoundHelper(fn));
      };
    } else {
      registerHelper = Ember['default'].Handlebars.helper;
    };

    registerHelper('moment', moment['default']);
    registerHelper('ago', ago['default']);
    registerHelper('duration', duration['default']);
  };

  exports['default'] = {
    name: 'ember-moment',

    initialize: initialize
  };
  /* container, app */

  exports.initialize = initialize;

});
define('modlog/initializers/export-application-global', ['exports', 'ember', 'modlog/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    var classifiedName = Ember['default'].String.classify(config['default'].modulePrefix);

    if (config['default'].exportApplicationGlobal && !window[classifiedName]) {
      window[classifiedName] = application;
    }
  }

  ;

  exports['default'] = {
    name: 'export-application-global',

    initialize: initialize
  };

});
define('modlog/mixins/listing-controller', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Mixin.create({
    queryParams: ['before', 'after', 'limit'],
    before: '',
    after: '',
    count: 0,
    limit: 25,
    last: Ember['default'].computed.alias('model.lastObject'),
    first: Ember['default'].computed.alias('model.firstObject'),
    hasMore: (function () {
      return this.get('listing.length') >= this.get('limit');
    }).property('listing.length', 'limit')
  });

});
define('modlog/mixins/listing-route', function () {

	'use strict';

});
define('modlog/router', ['exports', 'ember', 'modlog/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  exports['default'] = Router.map(function () {
    this.route('log', { path: '/r/:subreddit' });
    this.resource('scanner', { path: '/scan' }, function () {
      this.resource('scan', { path: ':subreddit' });
    });
    this.route('radio');
    this.route('monitor');
    this.route('privacy');
  });

});
define('modlog/routes/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    snoocore: Ember['default'].inject.service(),
    gradio: Ember['default'].inject.service(),

    model: function model() {
      return this.get('snoocore');
    },

    redirect: function redirect() {
      var route = this;
      return this.get('snoocore').checkLogin().then(function (isLoggedIn) {
        if (isLoggedIn) {
          route.transitionTo('monitor');
        }
      });
    },

    actions: {
      playRadio: function playRadio() {
        this.get('gradio').play();
      },
      stopRadio: function stopRadio() {
        this.get('gradio').stop();
      },
      playNext: function playNext() {
        this.get('gradio').playNext();
      },
      playPrevious: function playPrevious() {
        this.get('gradio').playPrevious();
      }
    }
  });

});
define('modlog/routes/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var decodeEntities = (function () {
    // this prevents any overhead from creating the object each time
    var element = document.createElement('div');

    function decodeHTMLEntities(str) {
      if (str && typeof str === 'string') {
        // strip script/html tags
        str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
        str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
        element.innerHTML = str;
        str = element.textContent;
        element.textContent = '';
      }

      return str;
    }

    return decodeHTMLEntities;
  })();

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      return Ember['default'].RSVP.resolve(Ember['default'].$.ajax({
        url: 'https://www.reddit.com/r/publicmodlogs/wiki/index.json'
      })).then(function (result) {
        return result.data;
      }).then(function (data) {
        data.content_html = decodeEntities(data.content_html);
        return data;
      });
    }
  });

});
define('modlog/routes/log', ['exports', 'ember', 'modlog/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(args) {
      var url = 'http://www.reddit.com/r/' + args.subreddit + '/about/log/.json?feed=' + config['default'].redditFeed + '&user=' + config['default'].redditUser + '&limit=100';
      return Ember['default'].RSVP.resolve(Ember['default'].$.ajax({
        url: 'https://jsonp.afeld.me/?url=' + encodeURIComponent(url),
        dataType: 'json'
      })).then(function (result) {
        return result.data.children.getEach('data');
      }).then(function (model) {
        model.subreddit = args.subreddit;
        //console.log('model', model);
        return model;
      });
    }
  });

});
define('modlog/routes/scan', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    snoocore: Ember['default'].inject.service(),
    modlog: Ember['default'].inject.service(),

    queryParams: {
      after: {
        refreshModel: true
      },
      before: {
        refreshModel: true
      },
      limit: {}
    },

    model: function model(args) {
      var snoo = this.get('snoocore.api');
      var modlog = this.get('modlog');
      var nextAfter;
      var detected = this.modelFor('scanner');
      return snoo('/r/' + args.subreddit).listing({
        limit: args.limit,
        after: args.after,
        before: args.before
      }).then(function (slice) {
        return slice.children.getEach('data');
      }).then(function (posts) {
        nextAfter = posts.get('lastObject.name');
        return Ember['default'].RSVP.all(posts.map(function (post) {
          return modlog.scanUrl(post.url)['catch'](function (e) {
            console.warn(e);
            return [];
          });
        }));
      }).then(function (removedLists) {
        var removed = [];
        removedLists.forEach(function (items) {
          removed.addObjects(items);
        });
        removed = removed.filter(function (post) {
          return !detected.findProperty('id', post.id);
        });
        removed.nextAfter = nextAfter;
        return removed;
      });
    },

    afterModel: function afterModel(model) {
      var detected = this.modelFor('scanner');
      model.forEach(function (post) {
        detected.insertAt(0, post);
      });
    }
  });

});
define('modlog/routes/scanner', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var detected = [];

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      return detected;
    }
  });

});
define('modlog/services/gradio', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  function getParamByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

  exports['default'] = Ember['default'].Service.extend(Ember['default'].Evented, {
    snoocore: Ember['default'].inject.service(),
    threadId: "uocz16gmx2s7",

    lastUpdate: {},

    playlist: [],

    autoplay: false,

    updates: (function () {
      return [];
    }).property(),

    play: function play() {
      this.playNext();
    },

    stop: function stop() {
      this.set("autoplay", false);
      this.set("lastUpdate.ytid", this.get("nextPlaylistId"));
    },

    fetchPlaylist: (function () {
      var anon = this.get("snoocore.anon");
      var self = this;
      var results = this.get("playlist");
      results.removeObjects(results);
      return anon("/r/FORTradio/top.json").listing({
        limit: 100
      }).then(function (slice) {
        results.addObjects(slice.allChildren.getEach("data").map(function (post) {
          return getParamByName(post.url, "v");
        }));
        function getNext() {
          return slice.next().then(function (nextSlice) {
            slice = nextSlice;
            results.addObjects(slice.allChildren.getEach("data").map(function (post) {
              return getParamByName(post.url, "v");
            }));
            if (!slice.empty) {
              return getNext();
            }
            return results;
          });
        }
        return getNext();
      }).then(function (results) {
        return shuffle(results);
      }).then(function (results) {
        self.set("playlist", results);
      });
    }).on("init"),

    currentPlaylistIdx: (function () {
      return this.get("playlist").indexOf(this.get("lastUpdate.ytid"));
    }).property("lastUpdate.ytid", "playlist.@each"),

    nextPlaylistId: (function () {
      var idx = (this.get("currentPlaylistIdx") + 1) % this.get("playlist.length");
      return this.get("playlist." + idx) || this.get("playlist.firstObject");
    }).property("currentPlaylistIdx"),

    previousPlaylistId: (function () {
      var idx = this.get("currentPlaylistIdx") - 1;
      if (idx < 0) {
        idx = this.get("playlist.length") + idx;
        idx = idx % this.get("playlist.length");
      }
      return this.get("playlist." + idx);
    }).property("currentPlaylistIdx"),

    playNext: function playNext() {
      this.set("autoplay", true);
      this.set("lastUpdate.ytid", this.get("nextPlaylistId"));
    },

    playPrevious: function playPrevious() {
      this.set("autoplay", true);
      this.set("lastUpdate.ytid", this.get("previousPlaylistId"));
    },

    socket: (function () {
      var id = this.get("threadId");
      var anon = this.get("snoocore.anon");
      var self = this;
      return Ember['default'].RSVP.hash({
        url: anon("/live/" + id + "/about.json").get().then(function (result) {
          return result.data.websocket_url;
        }),
        listing: anon("/live/" + id + ".json").listing({}).then(function (slice) {
          return (slice.children || []).getEach("data");
        })
      }).then(function (hash) {
        var ws = new WebSocket(hash.url);
        self.trigger("didReceiveSocketEvent", hash.listing[0]);
        ws.onopen = function () {};
        ws.onerror = function (e) {
          console.log("socket error", e);
        };
        ws.onclose = function () {
          console.log("socket close");
        };
        ws.onmessage = function (evt) {
          Ember['default'].run(function () {
            var data = JSON.parse(evt.data);
            if (!data || !data.payload || !data.payload.data) {
              return;
            }
            self.trigger("didReceiveSocketEvent", data.payload.data);
          });
        };
      });
    }).property("threadId"),

    didReceiveSocketEvent: (function (data) {
      var anon = this.get("snoocore.anon");
      var self = this;
      var lines = data.body.split("\n").map(function (line) {
        return line.trim();
      }).without("");
      var link = lines[0];
      var tube = lines[lines.length - 1];
      var parts = link.split("/");
      var id = parts.pop();
      var slut = parts.pop();
      var postId = parts.pop();
      var ytid = getParamByName(tube, "v");
      return anon("/api/info").get({
        id: "t3_" + postId + ",t1_" + id
      }).then(function (result) {
        var update = {
          url: link,
          post: Ember['default'].get(result, "data.children.0.data"),
          comment: Ember['default'].get(result, "data.children.1.data"),
          ytid: self.get("lastUpdate.ytid") || ytid
        };
        self.get("updates").insertAt(0, update);
        self.set("lastUpdate", update);
      });
    }).on("didReceiveSocketEvent"),

    connectSocket: (function () {
      var socket = this.get("socket");
    }).on("init")
  });

});
define('modlog/services/modlog', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Service.extend(Ember['default'].Evented, {
    snoocore: Ember['default'].inject.service(),

    handleExpiredAuth: (function () {
      var self = this;
      this.get('snoocore.api').on('access_token_expired', function (responseError) {
        window.location = self.get('snoocore.loginUrl');
      });
    }).observes('snoocore.api').on('init'),

    multis: {},

    subs: (function () {
      return ['snew', 'modlog', 'moderationlog', 'removedcomments', 'moderationlog'].concat(this.getMulti('self')).concat(this.getMulti('link')).uniq().sort();
    }).property('multis', 'multis'),

    getMulti: function getMulti(name) {
      return this.get('multis.' + name.toLowerCase()) || [];
    },

    fetchMultis: (function () {
      var anon = this.get('snoocore.anon');
      var self = this;
      return anon('/api/multi/user/PoliticBot').get({}).then(function (result) {
        return result.getEach('data').map(function (multi) {
          multi.subreddits = (multi.subreddits || []).getEach('name').map(function (j) {
            return j.toLowerCase();
          });
          return multi;
        });
      }).then(function (multis) {
        var result = {};
        multis.forEach(function (multi) {
          result[multi.name.toLowerCase()] = multi.subreddits;
        });
        return result;
      }).then(function (multis) {
        self.set('multis', multis);
        return multis;
      });
    }).on('init'),

    scanUrl: function scanUrl(url) {
      var anon = this.get('snoocore.anon');
      var snoo = this.get('snoocore.api');
      var self = this;
      return anon('/api/info').get({ url: url }).then(function (result) {
        return (result.data.children || []).getEach('data');
      }).then(function (known) {
        return known.filter(function (item) {
          return item.author !== '[deleted]';
        });
      }).then(function (known) {
        if (!known) {
          return;
        }
        if (known.length === 1) {
          var item = known[0];
          if (!item.over_18 && !item.domain.match(/(imgur|reddit.com)/)) {
            snoo('/api/submit').post({
              sr: 'Stuff',
              kind: 'link',
              title: item.title.slice(0, 299),
              url: item.url + '#' + item.subreddit + '|' + item.author,
              extension: 'json',
              sendreplies: false
            });
          }
          return;
        }
        var mirror = known.get('firstObject.id');
        return anon('/duplicates/$article').listing({
          $article: mirror, limit: 100
        }, { listingIndex: 1 }).then(function (dupes) {
          return (dupes.children || []).getEach('data');
        }).then(function (dupes) {
          if (!known) {
            return [];
          }
          var knownIds = known.getEach('id');
          var dupeIds = dupes.getEach('id').concat([mirror]);
          var removedIds = knownIds.slice().removeObjects(dupeIds);
          var known = known.sortBy('sort:desc');
          self.processPosts(known);
          return removedIds.map(function (id) {
            return known.findProperty('id', id);
          });
        });
      });
    },

    detected: (function () {
      return [];
    }).property(),
    detectedComments: (function () {
      return [];
    }).property(),
    reported: (function () {
      return [];
    }).property(),
    reportedComments: (function () {
      return [];
    }).property(),
    scannedUsers: (function () {
      return {};
    }).property(),
    unprocessed: Ember['default'].computed.setDiff('detected', 'processed'),
    unprocessedComments: Ember['default'].computed.setDiff('detectedComments', 'processedComments'),
    processed: (function () {
      return [];
    }).property(),
    processedComments: (function () {
      return [];
    }).property(),
    shouldReport: Ember['default'].computed.alias('snoocore.isLoggedIn'),

    scanLoop: function scanLoop(listing) {
      var modlog = this;
      var before;
      var detected = this.get('detected');
      var reported = this.get('reported');
      var snoo = this.get('snoocore.api');
      function loop() {
        var shouldReport = modlog.get('snoocore.isLoggedIn');
        return modlog.fetchMultis().then(function () {
          return modlog.scanListing(listing, detected, before);
        }).then(function (removed) {
          before = removed.nextbefore;
          return (removed || []).filter(function (item) {
            return !detected.findProperty('id', item.id);
          });
        }).then(loop);
      }
      return loop();
    },

    unprocessedDidChange: (function () {
      var snoo = this.get('snoocore.api');
      if (!this.get('shouldReport')) {
        return;
      }
      var unprocessed = this.get('unprocessed').slice();
      var reported = this.get('reported');
      if (!unprocessed.length) {
        return;
      }
      this.get('processed').addObjects(unprocessed);

      return Ember['default'].RSVP.all(unprocessed.map(function (item) {
        var flair = item.subreddit + '|' + item.author;
        var score = item.score;
        if (item.score > 0) {
          score = '+' + item.score;
        }
        return snoo('/api/submit').post({
          sr: 'modlog',
          kind: 'link',
          title: (score + ' ' + item.num_comments + ' ' + item.title).slice(0, 299),
          url: 'https://rm.reddit.com' + item.permalink + '#' + flair,
          extension: 'json',
          sendreplies: false
        }).then(function () {
          reported.addObject(item);
        })['catch'](function () {})['finally'](function () {
          if (item.score > 100 || item.num_comments > 50) {
            return snoo('/api/submit').post({
              sr: 'ModerationLog',
              kind: 'link',
              title: (score + ' ' + item.num_comments + ' ' + item.title).slice(0, 299),
              url: 'https://rm.reddit.com' + item.permalink + '#' + flair,
              extension: 'json',
              sendreplies: false
            });
          }
        });
      }));
    }).observes('unprocessed.@each', 'shouldReport').on('init'),

    unprocessedCommentsDidChange: (function () {
      var snoo = this.get('snoocore.api');
      if (!this.get('shouldReport')) {
        return;
      }
      var unprocessed = this.get('unprocessedComments').slice();
      var reported = this.get('reportedComments');
      if (!unprocessed.length) {
        return;
      }
      this.get('processedComments').addObjects(unprocessed);
      return Ember['default'].RSVP.all(unprocessed.map(function (item) {
        var flair = item.subreddit + '|' + item.author;
        var score = item.score;
        if (item.score > 0) {
          score = '+' + item.score;
        }
        return snoo('/api/submit').post({
          sr: 'modlog',
          kind: 'link',
          title: (score + ' Comment ' + item.id + 'on ' + item.link_id + ':' + item.parent_id + ' ' + item.link_title).slice(0, 299),
          url: 'https://rm.reddit.com' + item.profilelink + '#' + flair,
          extension: 'json',
          sendreplies: false
        }).then(function () {
          reported.addObject(item);
        })['finally'](function () {
          if (Math.abs(item.score) > 25 || item.body.length > 1000) {
            return snoo('/api/submit').post({
              sr: 'RemovedComments',
              kind: 'link',
              title: (score + ' Comment ' + item.id + 'on ' + item.link_id + ':' + item.parent_id + ' ' + item.link_title).slice(0, 299),
              url: 'https://rm.reddit.com' + item.permalink + '#' + flair,
              extension: 'json',
              sendreplies: false
            });
          }
        })['catch'](function () {});
      }));
    }).observes('detectedComments.length').on('init'),

    findMissingComments: function findMissingComments(comments) {
      var anon = this.get('snoocore.anon');
      var detected = this.get('detectedComments');
      return anon('/api/info').get({
        id: comments.getEach('name').join(',')
      }).then(function (result) {
        return result.data.children.getEach('data');
      }).then(function (result) {
        return result.filterProperty('author', '[deleted]');
      }).then(function (removed) {
        return removed.map(function (item) {
          return comments.findProperty('id', item.id);
        });
      }).then(function (removed) {
        detected.addObjects(removed.filter(function (item) {
          return !detected.findProperty('id', item.id);
        }));
        return removed;
      });
    },

    processPosts: function processPosts(posts) {
      var snoo = this.get('snoocore.api');
      var self = this;
      var linksubs = this.getMulti('link');
      var selfsubs = this.getMulti('self');
      this.getMulti('link').forEach(function (sub) {
        return posts.filterProperty('is_self', false).filter(function (item) {
          return !!item.url && self.getMulti(sub).contains(item.subreddit.toLowerCase());
        }).forEach(function (item) {
          console.log('link', item);
          return snoo('/api/submit').post({
            sr: sub,
            kind: 'link',
            title: item.title.slice(0, 299),
            url: item.url,
            extension: 'json',
            sendreplies: false
          });
        });
      });
      this.getMulti('self').forEach(function (sub) {
        posts.filterProperty('is_self', true).filter(function (item) {
          return self.getMulti(sub).contains(item.subreddit.toLowerCase());
        }).forEach(function (item) {
          console.log('self', item);
          return snoo('/api/submit').post({
            sr: sub,
            kind: 'link',
            title: item.title,
            url: 'https://us.reddit.com' + item.permalink + '#' + item.subreddit + '|' + item.author,
            extension: 'json',
            sendreplies: false
          });
        });
      });
    },

    scanListing: function scanListing(listing, detected, before) {
      var anon = this.get('snoocore.anon');
      var snoo = this.get('snoocore.api');
      var modlog = this;
      var self = this;
      detected = detected || [];
      return anon('/r/' + listing).listing({
        limit: 100,
        before: before
      }).then(function (slice) {
        return (slice.children || []).getEach('data');
      }).then(function (posts) {
        return posts.filterProperty('is_self', false);
      }).then(function (posts) {
        return posts; //.filterProperty('over_18', false);
      }).then(function (posts) {
        before = posts.get('firstObject.name');
        self.processPosts(posts);
        return posts.getEach('author').uniq().without('[deleted]');
      }).then(function (authors) {
        return Ember['default'].RSVP.all(authors.map(function (author) {
          return anon('/user/' + author + '/overview').listing({
            limit: 100
          }).then(function (slice) {
            return (slice.children || []).getEach('data');
          }).then(function (items) {
            var urls = items.filterProperty('is_self', false).getEach('url').without(undefined).uniq().slice(0, 10);
            var comments = items.filter(function (item) {
              return !!item.parent_id;
            });
            var after = null;
            comments = comments.map(function (comment) {
              if (after) {
                after.before = comment.name;
                comment.after = after.name;
              }
              after = comment;
              return comment;
            });
            comments.forEach(function (item) {
              item.profilelink = '/user/' + item.author + '/comments?limit=1&before=' + item.before + '&after=' + item.after;
              return item;
            });
            comments.popObject();
            comments = comments.reverse();
            comments.popObject();
            return Ember['default'].RSVP.all(urls.map(function (url) {
              return modlog.scanUrl(url)['catch'](function (e) {
                console.warn(e);
                return [];
              });
            })).then(function (removedLists) {
              var removed = [];
              if (!removedLists) {
                return;
              }
              removedLists.forEach(function (items) {
                removed.addObjects((items || []).filter(function (post) {
                  return !detected.findProperty('id', post.id);
                }));
              });
              detected.addObjects(removed);
              return removed;
            }).then(function (removed) {
              if (!removed) {
                return [];
              }
              if (!comments.length) {
                return removed;
              }
              return modlog.findMissingComments(comments).then(function () {
                return removed;
              });
            });
          })['catch'](function (error) {
            console.warn('error with', author, error);
            return [];
          });
        }));
      }).then(function (removedLists) {
        var removed = [];
        removedLists.forEach(function (items) {
          removed.addObjects(items);
        });
        removed.listing = listing;
        removed.nextbefore = before;
        return removed;
      });
    }
  });

  //console.warn(error, error.stack);

  //console.warn(error, error.stack);

});
define('modlog/services/snoocore', ['exports', 'ember', 'modlog/config/environment'], function (exports, Ember, config) {

  'use strict';

  /* globals Snoocore */
  function getParamByName(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.hash.replace(/^#/, '?'));
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  exports['default'] = Ember['default'].Service.extend({
    userAgent: 'ModLog 0.0.1 by go1dfish',

    scope: ['submit'],

    api: (function () {
      return new Snoocore({
        userAgent: this.get('userAgent'),
        decodeHtmlEntities: true,
        throttle: 30000,
        oauth: {
          type: 'implicit',
          mobile: false,
          duration: 'temporary',
          key: config['default'].consumerKey,
          redirectUri: config['default'].redirectUrl,
          scope: this.get('scope')
        }
      });
    }).property('userAgent', 'scope'),

    anon: (function () {
      return new Snoocore({
        userAgent: this.get('userAgent'),
        decodeHtmlEntities: true,
        throttle: 2000,
        oauth: {
          type: 'implicit',
          mobile: false,
          duration: 'temporary',
          key: config['default'].consumerKey,
          redirectUri: config['default'].redirectUrl,
          scope: ['read', 'history']
        }
      });
    }).property('userAgent'),

    loginUrl: (function () {
      return this.get('api').getImplicitAuthUrl().replace('www.reddit', 'us.reddit');
    }).property('user', 'api'),

    checkLogin: function checkLogin() {
      var code = getParamByName('access_token');
      var self = this;
      var snoo = this.get('api');
      if (code) {
        return snoo.auth(code).then(function () {
          self.set('isLoggedIn', true);
          return true;
        });
      }
      return Ember['default'].RSVP.resolve(false);
    }
  });

});
define('modlog/templates/application', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "profs-gradio", [], {"update": get(env, context, "gradio.lastUpdate"), "class": "container"});
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("span");
          dom.setAttribute(el1,"class","glyphicon glyphicon-music");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" PRoFS ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("span");
          dom.setAttribute(el1,"class","label label-danger");
          var el2 = dom.createTextNode("nsfw");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.1",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("button");
            dom.setAttribute(el1,"class","btn btn-danger");
            var el2 = dom.createElement("span");
            dom.setAttribute(el2,"class","glyphicon glyphicon-stop");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, element = hooks.element;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element1 = dom.childAt(fragment, [1]);
            element(env, element1, context, "action", ["stopRadio"], {});
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.1",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("button");
            dom.setAttribute(el1,"class","btn btn-primary");
            var el2 = dom.createElement("span");
            dom.setAttribute(el2,"class","glyphicon glyphicon-play");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, element = hooks.element;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element0 = dom.childAt(fragment, [1]);
            element(env, element0, context, "action", ["playRadio"], {});
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          dom.setAttribute(el1,"class","btn btn-warning");
          var el2 = dom.createElement("span");
          dom.setAttribute(el2,"class","glyphicon glyphicon-step-backward");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          dom.setAttribute(el1,"class","btn btn-warning");
          var el2 = dom.createElement("span");
          dom.setAttribute(el2,"class","glyphicon glyphicon-step-forward");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, element = hooks.element, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element2 = dom.childAt(fragment, [1]);
          var element3 = dom.childAt(fragment, [5]);
          var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
          element(env, element2, context, "action", ["playPrevious"], {});
          block(env, morph0, context, "if", [get(env, context, "gradio.autoplay")], {}, child0, child1);
          element(env, element3, context, "action", ["playNext"], {});
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","navbar navbar-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","container");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","navbar-header");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"id","navbar");
        dom.setAttribute(el3,"class","navbar-collapse collapse");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("ul");
        dom.setAttribute(el4,"class","nav navbar-nav");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("a");
        var el7 = dom.createTextNode("\n            [pressiah button]\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"id","maincontainer");
        dom.setAttribute(el1,"class","container");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("footer");
        dom.setAttribute(el1,"id","footer");
        dom.setAttribute(el1,"class","container");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("hr");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h5");
        var el3 = dom.createTextNode("\n    All ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        dom.setAttribute(el3,"target","github");
        dom.setAttribute(el3,"href","https://github.com/Fair-Share");
        var el4 = dom.createTextNode("code and concepts");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    are licensed under ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        dom.setAttribute(el3,"href","http://www.wtfpl.net");
        dom.setAttribute(el3,"target","license");
        var el4 = dom.createTextNode("WTFPLv2");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode(".  Build something!\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h5");
        var el3 = dom.createElement("a");
        dom.setAttribute(el3,"href","https://us.reddit.com/r/POLITIC/comments/37ovia/politicbot_was_shadowbanned_yesterday_for_spam/");
        var el4 = dom.createTextNode("\n    This app claims no affiliation with reddit inc. nor does reddit inc. endorse it.");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("strong");
        var el3 = dom.createTextNode("NO CONTENT OR DATA IS HOSTED HERE!!!");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("  This is just a client application written in javascript.\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("hr");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","gradio-controls");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","btn-group");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, inline = hooks.inline, get = hooks.get, element = hooks.element, content = hooks.content, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element4 = dom.childAt(fragment, [0, 1]);
        var element5 = dom.childAt(element4, [3, 1, 1, 1]);
        var element6 = dom.childAt(fragment, [7, 1]);
        var morph0 = dom.createMorphAt(dom.childAt(element4, [1]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [2]),0,0);
        var morph2 = dom.createMorphAt(dom.childAt(fragment, [4, 3]),5,5);
        var morph3 = dom.createMorphAt(fragment,6,6,contextualElement);
        var morph4 = dom.createMorphAt(element6,1,1);
        var morph5 = dom.createMorphAt(element6,3,3);
        inline(env, morph0, context, "link-to", ["ModLog", "index"], {"class": "navbar-brand"});
        element(env, element5, context, "bind-attr", [], {"href": get(env, context, "model.loginUrl")});
        content(env, morph1, context, "outlet");
        inline(env, morph2, context, "link-to", ["Privacy Policy", "privacy"], {});
        block(env, morph3, context, "if", [get(env, context, "gradio.lastUpdate.ytid")], {}, child0, null);
        block(env, morph4, context, "link-to", ["radio"], {"class": "btn btn-default"}, child1, null);
        block(env, morph5, context, "if", [get(env, context, "gradio.playlist.length")], {}, child2, null);
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/components/declaration-of-independence-for-reddit', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h4");
        var el2 = dom.createTextNode("Important announcement for reddit RE: People's Republic of Free ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/snew/");
        var el3 = dom.createTextNode("/r/Snew aka PRoFS");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  We hold these truths to be self-evident, that all people are created equal, that they are endowed by their ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/fsm");
        var el3 = dom.createTextNode("Creator");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" with certain unalienable Rights, that among these are Life, Liberty and the ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://en.wikipedia.org/wiki/Poe's_law");
        dom.setAttribute(el2,"target","reddit");
        var el3 = dom.createTextNode("pursuit of Lulz.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  --That to secure these rights, ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/reddit.com/about/moderators");
        dom.setAttribute(el2,"target","reddit");
        var el3 = dom.createTextNode("Governments");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" are instituted among ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://www.youtube.com/watch?v=3e5gTrRzIxA");
        var el3 = dom.createTextNode("meatbags");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(", deriving their just powers from the ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/undelete/comments/3696tk/1086_based_on_your_own_data_35_of_the_complaints/?");
        var el3 = dom.createTextNode("consent of the governed");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(",\n  --That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government,\n  laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness.\n  Prudence, indeed, will dictate that ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/reddit.com/comments/87/the_downing_street_memo/");
        dom.setAttribute(el2,"target","reddit");
        var el3 = dom.createTextNode("Governments long established");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" should not be changed for ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/thebutton/");
        var el3 = dom.createTextNode("light and transient causes");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("; and accordingly ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://reddithistory.wikia.com/wiki/Digg_exodus");
        dom.setAttribute(el2,"target","reddit");
        var el3 = dom.createTextNode("all experience hath shewn, that mankind are more disposed to suffer, while evils are sufferable, than to right themselves by abolishing the forms to which they are accustomed.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  But when a ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/subredditcancer/");
        var el3 = dom.createTextNode("long train of abuses and usurpations");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(", pursuing invariably the same Object evinces a design to ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://i.imgur.com/nXjXVEm.png");
        dom.setAttribute(el2,"target","reddit");
        var el3 = dom.createTextNode("reduce them under absolute Despotism");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(", it is their right, ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("strong");
        var el3 = dom.createTextNode("it is their duty");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(", to throw off such Government, and to provide ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/snew/about/moderators");
        var el3 = dom.createTextNode("new Guards for their future security.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  --Such has been the patient sufferance of these subreddits; and such is now the necessity which constrains them to alter their former Systems of Government.\n  The history of the present ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/IAmA/comments/1nfx00/iama_cofounder_of_reddit_alexis_ohanian_amaath/ccia9gq?context=1");
        dom.setAttribute(el2,"target","new");
        var el3 = dom.createTextNode("kn0thing");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" and\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/paoyongyang");
        var el3 = dom.createTextNode("ekjp");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" is a history of repeated ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://www.reddit.com/r/redditcensorship");
        dom.setAttribute(el2,"target","reddit");
        var el3 = dom.createTextNode("injuries and usurpations");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(", all having in direct object the establishment of an ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://www.npr.org/sections/alltechconsidered/2015/05/19/407971708/reddits-new-harassment-policy-aimed-at-creating-a-safe-platform");
        var el3 = dom.createTextNode("absolute Tyranny over these communities.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/domain/zh.reddit.com/");
        var el3 = dom.createTextNode("To prove this, let Facts be submitted to a candid world.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  In every stage of these ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/oppression");
        dom.setAttribute(el2,"target","reddit");
        var el3 = dom.createTextNode("Oppressions");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(", ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/BringBackReddit/comments/36alxp/my_open_letter_why_is_rtwoxchromosomes_the_only/");
        var el3 = dom.createTextNode("We have Petitioned for Redress in the most humble terms:");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  Our repeated Petitions have been answered ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/POLITIC/comments/37ovia/politicbot_was_shadowbanned_yesterday_for_spam/");
        dom.setAttribute(el2,"target","reddit");
        var el3 = dom.createTextNode("only by repeated injury. ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  A Prince whose character is thus marked by every act which may define a Tyrant, is unfit to be the ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","");
        var el3 = dom.createTextNode("ruler of a free people.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  Nor have We been wanting in attentions to our Scarlet Letter brethren.\n  We have warned them from time to time of attempts by their legislature to extend an ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://projects.eff.org/~barlow/Declaration-Final.html");
        var el3 = dom.createTextNode("unwarrantable jurisdiction");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" over us.\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://www.reddit.com/user/politicbot/m/readme");
        var el3 = dom.createTextNode("We have reminded them of the circumstances of our emigration and settlement here. ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  We have ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","");
        var el3 = dom.createTextNode("appealed to their native justice and magnanimity");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(", and we have conjured them by the ties of our common kindred to ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/IAmA/comments/32povn/ama_request_ellen_pao_ceo_of_reddit/");
        var el3 = dom.createTextNode("disavow these usurpations");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(", which, would inevitably interrupt our connections and correspondence.\n  They too have been deaf to the voice of justice and of consanguinity. We must, therefore, acquiesce in the necessity, which denounces our Separation, and hold them, as we hold the rest of mankind, Enemies in War, in Peace Friends.\n  We, therefore, the Representatives of the People's Republic of Free ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/snew/");
        var el3 = dom.createTextNode("/r/Snew");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(", in General Congress, Assembled, appealing to the Supreme Judge of the world for the rectitude of our intentions,\n  do, in the Name, and by Authority of the good People of these subreddits, solemnly publish and declare, That these United Communities are, and of Right ought to be\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/IAmA/comments/sk1ut/iam_yishan_wong_the_reddit_ceo/c4en44e");
        var el3 = dom.createTextNode("Free and Independent City-States");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("; that they are Absolved from all Allegiance to the British Crown, and that all political connection between them and the State of Great Britain, is and ought to be totally dissolved; and that as Free and Independent States, they have full Power to levy War, conclude Peace, contract Alliances, establish Commerce, and to do all other Acts and Things which Independent States may of right do. And for the support of this Declaration, with a firm reliance on the protection of divine Providence, we mutually pledge to each other our Lives, our Fortunes and our sacred Honor.\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  It is therefore the ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/changemyview/comments/30u79c/cmv_reddit_still_is_a_bastion_of_free_speech_on/");
        var el3 = dom.createTextNode("recently formed opinion");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" of \"");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/user/go1dfish");
        var el3 = dom.createTextNode("美国鬼子 ಠ_ಠ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\" and \"");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/user/PoliticBot");
        var el3 = dom.createTextNode("文革中的机器毛 ಠ_ಠ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\" that the paowers that be have had every opportunity to graciously accept an\n  honorable defeat at the ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/help/useragreement#section_reddit_is_for_fun");
        var el3 = dom.createTextNode("Game of Reddit");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" in the face of a worthy advesary.\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  Furthermore we believe that ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/Upvoted/comments/317sds/episode_12_the_surprisingly_complex_life_of_a/cpz941e");
        var el3 = dom.createTextNode("the defaults have collectively and systematically jumped the shark");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  Therefore we demand the following ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://us.reddit.com/r/redditpolicy");
        var el3 = dom.createTextNode("terms of unconditional surrender");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" to the community from whence you draw all power.\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  Though you should absolutely consider this an ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("strong");
        var el3 = dom.createTextNode("object lesson in demeaning torment");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" within a \"safe space\" it is not harassment under the rules of this game because we do not seek your execution, and we do not seek your exile.\n  We only seek that you abdicate the power to ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://collectiveliberation.org/wp-content/uploads/2013/01/Lorde_The_Masters_Tools.pdf");
        var el3 = dom.createTextNode("LORDE");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" over a community you have so clearly demonstrated that you are incapable of understanding.\n  Kicking you out of it would be woefully counter productive, because learning is something you very desperately need.\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h1");
        var el3 = dom.createTextNode("We politefully and respectfully request that Ellen Pao **immediately** abdicate power and pay any severance as reparations to the ACLU for the damages you have caused to the free peoples of the internet.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h2");
        var el3 = dom.createTextNode("We may only be able to temporarily tear down the masters house with your own tools");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h3");
        var el3 = dom.createTextNode("But we can certainly tank the value of your intellectual property so long as our host government still supports the ideals reflected in this declaration.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/components/ember-youtube', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.1",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Pause");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.1",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Play");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      var child2 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.1",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Unmute");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      var child3 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.1",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Mute");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("	");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("menu");
          dom.setAttribute(el1,"class","EmberYoutube-controls");
          var el2 = dom.createTextNode("\n		");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("button");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n		");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("button");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n	");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, element = hooks.element, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element3 = dom.childAt(fragment, [1]);
          var element4 = dom.childAt(element3, [1]);
          var element5 = dom.childAt(element3, [3]);
          var morph0 = dom.createMorphAt(element4,0,0);
          var morph1 = dom.createMorphAt(element5,0,0);
          element(env, element4, context, "action", ["togglePlay"], {});
          block(env, morph0, context, "if", [get(env, context, "isPlaying")], {}, child0, child1);
          element(env, element5, context, "action", ["toggleVolume"], {});
          block(env, morph1, context, "if", [get(env, context, "isMuted")], {}, child2, child3);
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("p");
          dom.setAttribute(el1,"class","EmberYoutube-time");
          var el2 = dom.createTextNode("\n			");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("/");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n		");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element2 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element2,1,1);
          var morph1 = dom.createMorphAt(element2,3,3);
          content(env, morph0, context, "currentTimeFormatted");
          content(env, morph1, context, "durationFormatted");
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("p");
          dom.setAttribute(el1,"class","EmberYoutube-progress");
          var el2 = dom.createTextNode("\n			");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("progress");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n		");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, attribute = hooks.attribute;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element1 = dom.childAt(fragment, [1, 1]);
          var attrMorph0 = dom.createAttrMorph(element1, 'value');
          var attrMorph1 = dom.createAttrMorph(element1, 'max');
          attribute(env, attrMorph0, element1, "value", get(env, context, "currentTimeValue"));
          attribute(env, attrMorph1, element1, "max", get(env, context, "durationValue"));
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("p");
          dom.setAttribute(el1,"class","EmberYoutube-debug");
          var el2 = dom.createElement("code");
          var el3 = dom.createTextNode("\n			ytid: ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("br");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n			state: ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("br");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n			isMuted: ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("br");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n			isPlaying: ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("br");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n		");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1, 0]);
          var morph0 = dom.createMorphAt(element0,1,1);
          var morph1 = dom.createMorphAt(element0,4,4);
          var morph2 = dom.createMorphAt(element0,7,7);
          var morph3 = dom.createMorphAt(element0,10,10);
          content(env, morph0, context, "ytid");
          content(env, morph1, context, "playerState");
          content(env, morph2, context, "isMuted");
          content(env, morph3, context, "isPlaying");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"id","EmberYoutube-player");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","EmberYoutube-controls");
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","EmberYoutube-yield");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element6 = dom.childAt(fragment, [2]);
        var morph0 = dom.createMorphAt(element6,1,1);
        var morph1 = dom.createMorphAt(element6,3,3);
        var morph2 = dom.createMorphAt(element6,5,5);
        var morph3 = dom.createMorphAt(element6,7,7);
        var morph4 = dom.createMorphAt(dom.childAt(fragment, [4]),1,1);
        block(env, morph0, context, "if", [get(env, context, "showControls")], {}, child0, null);
        block(env, morph1, context, "if", [get(env, context, "showTime")], {}, child1, null);
        block(env, morph2, context, "if", [get(env, context, "showProgress")], {}, child2, null);
        block(env, morph3, context, "if", [get(env, context, "showDebug")], {}, child3, null);
        content(env, morph4, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/components/loading-widget', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","loading");
        var el2 = dom.createTextNode("Loading...");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/components/mod-action', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h5");
          var el2 = dom.createTextNode("Target:\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2,"target","reddit");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1, 1]);
          var morph0 = dom.createMorphAt(element0,0,0);
          var attrMorph0 = dom.createAttrMorph(element0, 'href');
          attribute(env, attrMorph0, element0, "href", concat(env, ["http://reddit.com", subexpr(env, context, "unbound", [get(env, context, "item.target_permalink")], {})]));
          content(env, morph0, context, "item.target_permalink");
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h5");
          var el2 = dom.createTextNode("Author: ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          content(env, morph0, context, "item.target_author");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h3");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" by  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("hr");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, get = hooks.get, inline = hooks.inline, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element1 = dom.childAt(fragment, [0]);
        var morph0 = dom.createMorphAt(element1,0,0);
        var morph1 = dom.createMorphAt(dom.childAt(element1, [2]),0,0);
        var morph2 = dom.createMorphAt(fragment,2,2,contextualElement);
        var morph3 = dom.createMorphAt(fragment,4,4,contextualElement);
        var morph4 = dom.createMorphAt(fragment,6,6,contextualElement);
        var morph5 = dom.createMorphAt(fragment,8,8,contextualElement);
        var morph6 = dom.createMorphAt(fragment,9,9,contextualElement);
        content(env, morph0, context, "item.action");
        content(env, morph1, context, "item.mod");
        inline(env, morph2, context, "ago", [get(env, context, "item.created_utc"), "X"], {});
        content(env, morph3, context, "item.details");
        content(env, morph4, context, "item.description");
        block(env, morph5, context, "if", [get(env, context, "item.target_permalink")], {}, child0, null);
        block(env, morph6, context, "if", [get(env, context, "item.target_author")], {}, child1, null);
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/components/profs-gradio', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h5");
          var el2 = dom.createElement("a");
          dom.setAttribute(el2,"target","reddit");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" - /u/");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("footer");
          var el2 = dom.createTextNode("/u/");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1]);
          var element1 = dom.childAt(element0, [0]);
          var morph0 = dom.createMorphAt(element1,1,1);
          var attrMorph0 = dom.createAttrMorph(element1, 'href');
          var morph1 = dom.createMorphAt(element0,2,2);
          var morph2 = dom.createUnsafeMorphAt(fragment,3,3,contextualElement);
          var morph3 = dom.createMorphAt(dom.childAt(fragment, [5]),1,1);
          attribute(env, attrMorph0, element1, "href", concat(env, [subexpr(env, context, "unbound", [get(env, context, "update.url")], {})]));
          content(env, morph0, context, "update.post.title");
          content(env, morph1, context, "update.post.author");
          content(env, morph2, context, "update.comment.body_html");
          content(env, morph3, context, "update.comment.author");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        var morph1 = dom.createMorphAt(fragment,2,2,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        inline(env, morph0, context, "ember-youtube", [], {"ytid": get(env, context, "update.ytid"), "class": "pull-right", "playing": "ytPlaying", "ended": "ytEnded", "autoplay": get(env, context, "gradio.autoplay"), "showControls": false});
        block(env, morph1, context, "each", [get(env, context, "gradio.updates")], {"keyword": "update"}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/components/removed-link', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("span");
          dom.setAttribute(el1,"class","label label-default");
          var el2 = dom.createTextNode("[");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("]");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          content(env, morph0, context, "item.link_flair_text");
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("span");
          dom.setAttribute(el1,"class","label label-danger");
          var el2 = dom.createTextNode("NSFW");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"class","btn btn-success pull-right");
        dom.setAttribute(el1,"target","reddit");
        var el2 = dom.createTextNode("Submit");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h4");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"target","reddit");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"target","_new");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h5");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" points\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" comments\nposted ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\nby ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2,"class","label label-info");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\nin ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2,"class","label label-primary");
        var el3 = dom.createTextNode("/r/");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute, block = hooks.block, content = hooks.content, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(fragment, [2]);
        var element2 = dom.childAt(element1, [3]);
        var element3 = dom.childAt(fragment, [4]);
        var element4 = dom.childAt(fragment, [6]);
        var attrMorph0 = dom.createAttrMorph(element0, 'href');
        var morph0 = dom.createMorphAt(element1,1,1);
        var morph1 = dom.createMorphAt(element1,2,2);
        var morph2 = dom.createMorphAt(element2,0,0);
        var attrMorph1 = dom.createAttrMorph(element2, 'href');
        var morph3 = dom.createMorphAt(element3,0,0);
        var attrMorph2 = dom.createAttrMorph(element3, 'href');
        var morph4 = dom.createMorphAt(element4,1,1);
        var morph5 = dom.createMorphAt(element4,3,3);
        var morph6 = dom.createMorphAt(element4,5,5);
        var morph7 = dom.createMorphAt(dom.childAt(element4, [7]),0,0);
        var morph8 = dom.createMorphAt(dom.childAt(element4, [9]),1,1);
        attribute(env, attrMorph0, element0, "href", concat(env, ["https://www.reddit.com/r/undelete/submit?title=", subexpr(env, context, "unbound", [get(env, context, "item.title")], {}), "&url=www.reddit.com", subexpr(env, context, "unbound", [get(env, context, "item.permalink")], {})]));
        block(env, morph0, context, "if", [get(env, context, "item.link_flair_text")], {}, child0, null);
        block(env, morph1, context, "if", [get(env, context, "item.over_18")], {}, child1, null);
        attribute(env, attrMorph1, element2, "href", concat(env, ["http://reddit.com/", subexpr(env, context, "unbound", [get(env, context, "item.permalink")], {})]));
        content(env, morph2, context, "item.title");
        attribute(env, attrMorph2, element3, "href", get(env, context, "item.url"));
        content(env, morph3, context, "item.url");
        content(env, morph4, context, "item.score");
        content(env, morph5, context, "item.num_comments");
        inline(env, morph6, context, "ago", [get(env, context, "item.created_utc"), "X"], {});
        content(env, morph7, context, "item.author");
        content(env, morph8, context, "item.subreddit");
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/error', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        var el2 = dom.createTextNode("Error: ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("pre");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [2]),0,0);
        content(env, morph0, context, "model");
        content(env, morph1, context, "model.stack");
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/index', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createUnsafeMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "model.content_html");
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/loading', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "loading-widget");
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/log', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
          inline(env, morph0, context, "mod-action", [], {"item": get(env, context, "item")});
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        var el2 = dom.createTextNode("Log for /r/");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("ol");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        content(env, morph0, context, "model.subreddit");
        block(env, morph1, context, "each", [get(env, context, "model")], {"keyword": "item"}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/monitor', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1,"target","reddit");
          var el2 = dom.createTextNode("/r/");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element1 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element1,1,1);
          var attrMorph0 = dom.createAttrMorph(element1, 'href');
          attribute(env, attrMorph0, element1, "href", concat(env, ["https://us.reddit.com/r/", subexpr(env, context, "unbound", [get(env, context, "sub")], {})]));
          content(env, morph0, context, "sub");
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h2");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("p");
          var el2 = dom.createTextNode("The bot will stop as soon as you close this tab, or in 1 hr");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          inline(env, morph0, context, "link-to", ["Thank you for participating!", "radio"], {});
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h2");
          dom.setAttribute(el1,"class","well monitor-button");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2,"class","btn btn-primary btn-lg");
          var el3 = dom.createTextNode("\n      [pressiah button]\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2,"class","label label-default");
          var el3 = dom.createTextNode("\n      'allow' or ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("a");
          dom.setAttribute(el3,"href","https://chrome.google.com/webstore/detail/modlog-lazy-pressiah-butt/ofkmlkdldhfkhbpcdfcefehljbahcieo?hl=en-US");
          dom.setAttribute(el3,"target","chromeext");
          var el4 = dom.createTextNode("[lazy pressiah]");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, element = hooks.element;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1, 1]);
          element(env, element0, context, "bind-attr", [], {"href": get(env, context, "snoocore.loginUrl")});
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","text-center");
        var el2 = dom.createTextNode("\nNow powering\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element2 = dom.childAt(fragment, [0]);
        var morph0 = dom.createMorphAt(element2,1,1);
        var morph1 = dom.createMorphAt(element2,2,2);
        block(env, morph0, context, "each", [get(env, context, "modlog.subs")], {"keyword": "sub"}, child0, null);
        block(env, morph1, context, "if", [get(env, context, "snoocore.isLoggedIn")], {}, child1, child2);
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/privacy', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","jumbotron");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h1");
        var el3 = dom.createTextNode("Privacy Policy");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h3");
        var el3 = dom.createTextNode("\n    This is separate from\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        dom.setAttribute(el3,"href","https://www.reddit.com/help/privacypolicy");
        dom.setAttribute(el3,"class","dontintercept");
        var el4 = dom.createTextNode("reddit.com's Privacy Policy");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("p");
        var el3 = dom.createTextNode("This app runs entirely in your browser and never phones home.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("p");
        var el3 = dom.createTextNode("There is no home to phone, this app is hosted on github pages.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("p");
        var el3 = dom.createTextNode("No data gets stored or sent back to non-reddit servers.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("p");
        var el3 = dom.createTextNode("You can verify this using your browser's network inspector.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/radio', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h1");
          dom.setAttribute(el1,"class","well monitor-button");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2,"class","btn btn-primary btn-lg");
          var el3 = dom.createTextNode("\n      [pressiah button]\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2,"class","label label-default");
          var el3 = dom.createTextNode("\n      'allow' or ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("a");
          dom.setAttribute(el3,"href","https://chrome.google.com/webstore/detail/modlog-lazy-pressiah-butt/ofkmlkdldhfkhbpcdfcefehljbahcieo?hl=en-US");
          dom.setAttribute(el3,"target","chromeext");
          var el4 = dom.createTextNode("[lazy pressiah]");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, element = hooks.element;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1, 1]);
          element(env, element0, context, "bind-attr", [], {"href": get(env, context, "snoocore.loginUrl")});
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","jumbotron");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h2");
        dom.setAttribute(el2,"class","center-text");
        var el3 = dom.createElement("a");
        dom.setAttribute(el3,"href","https://www.reddit.com/live/uocz16gmx2s7");
        dom.setAttribute(el3,"target","reddit");
        var el4 = dom.createTextNode("\n  People's Republic of Free Snew Guerilla Radio");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),3,3);
        block(env, morph0, context, "unless", [get(env, context, "snoocore.isLoggedIn")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/scan', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        inline(env, morph0, context, "link-to", ["Keep looking", subexpr(env, context, "query-params", [], {"after": get(env, context, "model.nextAfter")})], {"class": "btn btn-default form-control"});
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/scanner', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.1",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createElement("hr");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,2,2,contextualElement);
            inline(env, morph0, context, "removed-link", [], {"item": get(env, context, "item")});
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.1",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h3");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" submissions detected [removed]");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
          var morph1 = dom.createMorphAt(fragment,3,3,contextualElement);
          dom.insertBoundary(fragment, null);
          content(env, morph0, context, "model.length");
          block(env, morph1, context, "each", [get(env, context, "model")], {"keyword": "item"}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        var morph1 = dom.createMorphAt(fragment,2,2,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "outlet");
        block(env, morph1, context, "if", [get(env, context, "model.length")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('modlog/templates/scanner/loading', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.1",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","loading");
        var el2 = dom.createTextNode("Scanning For Removals...");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('modlog/tests/app.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('app.js should pass jshint', function() { 
    ok(true, 'app.js should pass jshint.'); 
  });

});
define('modlog/tests/components/profs-gradio.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/profs-gradio.js should pass jshint', function() { 
    ok(true, 'components/profs-gradio.js should pass jshint.'); 
  });

});
define('modlog/tests/controllers/application.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/application.js should pass jshint', function() { 
    ok(true, 'controllers/application.js should pass jshint.'); 
  });

});
define('modlog/tests/controllers/monitor.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/monitor.js should pass jshint', function() { 
    ok(true, 'controllers/monitor.js should pass jshint.'); 
  });

});
define('modlog/tests/controllers/radio.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/radio.js should pass jshint', function() { 
    ok(true, 'controllers/radio.js should pass jshint.'); 
  });

});
define('modlog/tests/controllers/scan.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/scan.js should pass jshint', function() { 
    ok(true, 'controllers/scan.js should pass jshint.'); 
  });

});
define('modlog/tests/helpers/resolver', ['exports', 'ember/resolver', 'modlog/config/environment'], function (exports, Resolver, config) {

  'use strict';

  var resolver = Resolver['default'].create();

  resolver.namespace = {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix
  };

  exports['default'] = resolver;

});
define('modlog/tests/helpers/resolver.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/resolver.js should pass jshint', function() { 
    ok(true, 'helpers/resolver.js should pass jshint.'); 
  });

});
define('modlog/tests/helpers/start-app', ['exports', 'ember', 'modlog/app', 'modlog/router', 'modlog/config/environment'], function (exports, Ember, Application, Router, config) {

  'use strict';



  exports['default'] = startApp;
  function startApp(attrs) {
    var application;

    var attributes = Ember['default'].merge({}, config['default'].APP);
    attributes = Ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    Ember['default'].run(function () {
      application = Application['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }

});
define('modlog/tests/helpers/start-app.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/start-app.js should pass jshint', function() { 
    ok(true, 'helpers/start-app.js should pass jshint.'); 
  });

});
define('modlog/tests/mixins/listing-controller.jshint', function () {

  'use strict';

  module('JSHint - mixins');
  test('mixins/listing-controller.js should pass jshint', function() { 
    ok(true, 'mixins/listing-controller.js should pass jshint.'); 
  });

});
define('modlog/tests/mixins/listing-route.jshint', function () {

  'use strict';

  module('JSHint - mixins');
  test('mixins/listing-route.js should pass jshint', function() { 
    ok(true, 'mixins/listing-route.js should pass jshint.'); 
  });

});
define('modlog/tests/router.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('router.js should pass jshint', function() { 
    ok(true, 'router.js should pass jshint.'); 
  });

});
define('modlog/tests/routes/application.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/application.js should pass jshint', function() { 
    ok(true, 'routes/application.js should pass jshint.'); 
  });

});
define('modlog/tests/routes/index.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/index.js should pass jshint', function() { 
    ok(true, 'routes/index.js should pass jshint.'); 
  });

});
define('modlog/tests/routes/log.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/log.js should pass jshint', function() { 
    ok(true, 'routes/log.js should pass jshint.'); 
  });

});
define('modlog/tests/routes/scan.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/scan.js should pass jshint', function() { 
    ok(true, 'routes/scan.js should pass jshint.'); 
  });

});
define('modlog/tests/routes/scanner.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/scanner.js should pass jshint', function() { 
    ok(true, 'routes/scanner.js should pass jshint.'); 
  });

});
define('modlog/tests/services/gradio.jshint', function () {

  'use strict';

  module('JSHint - services');
  test('services/gradio.js should pass jshint', function() { 
    ok(false, 'services/gradio.js should pass jshint.\nservices/gradio.js: line 11, col 103, Expected \'{\' and instead saw \';\'.\nservices/gradio.js: line 125, col 8, Missing semicolon.\nservices/gradio.js: line 139, col 9, \'slut\' is defined but never used.\nservices/gradio.js: line 157, col 9, \'socket\' is defined but never used.\n\n4 errors'); 
  });

});
define('modlog/tests/services/modlog.jshint', function () {

  'use strict';

  module('JSHint - services');
  test('services/modlog.js should pass jshint', function() { 
    ok(false, 'services/modlog.js should pass jshint.\nservices/modlog.js: line 80, col 19, \'known\' is already defined.\nservices/modlog.js: line 114, col 11, Missing semicolon.\nservices/modlog.js: line 8, col 66, \'responseError\' is defined but never used.\nservices/modlog.js: line 104, col 9, \'reported\' is defined but never used.\nservices/modlog.js: line 105, col 9, \'snoo\' is defined but never used.\nservices/modlog.js: line 107, col 11, \'shouldReport\' is defined but never used.\nservices/modlog.js: line 224, col 9, \'linksubs\' is defined but never used.\nservices/modlog.js: line 225, col 9, \'selfsubs\' is defined but never used.\nservices/modlog.js: line 260, col 9, \'snoo\' is defined but never used.\n\n9 errors'); 
  });

});
define('modlog/tests/services/snoocore.jshint', function () {

  'use strict';

  module('JSHint - services');
  test('services/snoocore.js should pass jshint', function() { 
    ok(true, 'services/snoocore.js should pass jshint.'); 
  });

});
define('modlog/tests/test-helper', ['modlog/tests/helpers/resolver', 'ember-qunit'], function (resolver, ember_qunit) {

	'use strict';

	ember_qunit.setResolver(resolver['default']);

});
define('modlog/tests/test-helper.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('test-helper.js should pass jshint', function() { 
    ok(true, 'test-helper.js should pass jshint.'); 
  });

});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('modlog/config/environment', ['ember'], function(Ember) {
  var prefix = 'modlog';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("modlog/tests/test-helper");
} else {
  require("modlog/app")["default"].create({"name":"modlog","version":"0.0.0.9bd89c01"});
}

/* jshint ignore:end */
//# sourceMappingURL=modlog.map