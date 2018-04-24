var port = chrome.runtime.connect({name: 'status'});

port.onMessage.addListener(function(msg) {
  console.assert(msg.type == 'status');
  if (msg.type !== 'status')
    return;

  if (msg.enabled) {
    var cb = document.getElementById("ext_toggle");
    cb.checked = true;
  }

  if (msg.sendHosts) {
    var cb = document.getElementById("domain_toggle");
    cb.checked = true;
  }

  changeDomainToggleEnabled(msg.enabled);
});

function saveExtentionStatus(enabled, sendHosts) {
  port.postMessage({
    type: "set",
    enabled,
    sendHosts,
  });
}

function changeDomainToggleEnabled(enabled) {
  className = enabled ? "enabled-text" : "disabled-text";
  var div = document.getElementById("domain_text");
  div.className = "control-text-smaller " + className;

  var cb = document.getElementById("domain_toggle");
  if (!enabled)
    cb.checked = false;
  cb.disabled = !enabled;
}

function onExtToggleClick() {
  var enabled = document.getElementById("ext_toggle").checked;
  var domainToggle = document.getElementById("domain_toggle");

  changeDomainToggleEnabled(enabled);

  var sendHosts = domainToggle.checked;

  saveExtentionStatus(enabled, sendHosts);
}

function onDomainToggleClick() {
  var enabled = document.getElementById("ext_toggle").checked;
  var sendHosts = document.getElementById("domain_toggle").checked;
  saveExtentionStatus(enabled, sendHosts);
}

window.onload = function() {
  document.getElementById("ext_toggle").addEventListener("click", onExtToggleClick);
  document.getElementById("domain_toggle").addEventListener("click", onDomainToggleClick);
  port.postMessage({type: 'get'});
}
