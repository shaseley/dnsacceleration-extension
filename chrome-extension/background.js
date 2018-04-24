var extensionConfig = {
  enabled: false,
  sendHosts: false,
  version: chrome.runtime.getManifest().version,
};

function setIcons(enabled) {
  var suffix = enabled ? ".png" : "_disabled.png";
  chrome.browserAction.setIcon({
      path: {
        16:"./images/dns16" + suffix,
        32:"./images/dns32" + suffix,
        48:"./images/dns48" + suffix,
      }
  });
}

function setExtensionStatus(enabled, sendHosts) {
  extensionConfig.enabled = enabled;
  extensionConfig.sendHosts = sendHosts;
  chrome.storage.local.set({
    enabled,
    sendHosts,
  });
  setIcons(enabled);
}

function postData(endpoint, data, dataType, success, fail) {
  if (!extensionConfig.enabled)
    return;

  // If we don't set contentType, this gets send as
  // application/x-www-form-urlencoded and body-parser doesn't handlie it.
  $.ajax({
    type: "POST",
    url: `https://www.dnsacceleration.systems/api/${endpoint}`,
    contentType:"application/json",
    data: JSON.stringify(data),
    success: function(res) {
      success(res);
    },
    error: fail,
    dataType: dataType,
  });
}

function shouldSendHosts() {
  return extensionConfig.sendHosts && !chrome.extension.isIncognitoContext;
}

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name == "status") {
    port.onMessage.addListener(function(msg) {
      if (msg.type == "get") {
        port.postMessage({
          type: "status",
          enabled: extensionConfig.enabled,
          sendHosts: extensionConfig.sendHosts,
        });
      } else if (msg.type == "set") {
        setExtensionStatus(msg.enabled, msg.sendHosts);
      }
    });
  } else if (port.name == "perf") {
    port.onMessage.addListener(function(msg) {
      if (msg.type === "register") {
        if (!extensionConfig.enabled) {
          port.postMessage({
            type: 'id',
            id: "disabled",
          });
          return;
        }

        var data = {
          site: "",
          version: extensionConfig.version,
        };

        if (!shouldSendHosts()) {
          data.site = "redacted";
        } else {
          var url = new URL(msg.url);
          data.site = `${url.protocol}//${url.hostname}`
        }

        postData('pageload', data, "json", function(res) {
          port.postMessage({
            type: 'id',
            id: res.id,
            enabled: true,
          });
        });

      } else if (msg.type === "entry") {
        if (!shouldSendHosts())
          msg.entry.name = "redacted";

        postData(
          `pageload/${msg.id}/entry`,
          msg.entry,
          "html",
          (res) => {},
          (jqXHR, textStatus, errorThrown) => {}
        );
      }
    });
  }
});

chrome.storage.local.get("enabled", function(o) {
  if (o.enabled === undefined) {
    setExtensionStatus(true, false);
  } else {
    extensionConfig.enabled = o.enabled;
    setIcons(o.enabled);
  }
});
