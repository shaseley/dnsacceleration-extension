let pageloadId;

function startObservingPerformance() {
  console.assert(!pageloadId);
  if (pageloadId)
    return;

  var port = chrome.runtime.connect({name: 'perf'});

  // We may see some entries before we finish registering.
  var perfCache = [];

  function sendPerfEntry(entry) {
    var name = entry.name;
    try {
      var url = new URL(entry.name);
      name = `${url.protocol}//${url.hostname}`
    }
    catch (e) {
    }

    var msg = {
      type: 'entry',
      id: pageloadId,
      entry: {
        name,
        entryType: entry.entryType,
        domainLookupStart: entry.domainLookupStart,
        domainLookupEnd: entry.domainLookupEnd,
        initiatorType: entry.initiatorType,
      }
    }

    if (entry.type)
      msg.entry.type = entry.type;

    port.postMessage(msg);
  }

  function registerPageload() {
    port.postMessage({
      type: 'register',
      url: window.location.href
    });
  }

  port.onMessage.addListener(function(msg) {
    console.assert(msg.type == "id");
    if (msg.type !== "id")
      return;
    pageloadId = msg.id;
    if (pageloadId != "disabled")
      perfCache.forEach(entry => sendPerfEntry(entry));
    perfCache = [];
  });

  function startObserving() {
    var observer = new PerformanceObserver(list => {
      if (!pageloadId) {
        Array.prototype.push.apply(perfCache, list.getEntries());
        return;
      }
      if (pageloadId == "disabled") {
        return;
      }
      list.getEntries().forEach(entry => sendPerfEntry(entry));
    });
    observer.observe({entryTypes: ['resource', 'navigation']});
  }

  registerPageload();
  startObserving();
}

startObservingPerformance();
