// Keep each Lectio tab's worker state in its own private extension document.
browser.runtime.onConnect.addListener(port => {
  const match = /^lxp-(workbench|punctuation):[a-f0-9]{32}$/.exec(port.name);
  const sender = port.sender;
  if (!match || sender?.id !== browser.runtime.id || !Number.isInteger(sender.tab?.id) ||
      sender.frameId !== 0 || !/^https:\/\/(?:www\.)?lectio\.dk\//.test(sender.url || '')) return;

  const host = document.createElement('iframe');
  host.hidden = true;
  const file = match[1] === 'workbench' ? 'workbench-host.html' : 'punctuation-frame.html';
  host.src = browser.runtime.getURL(file);
  const close = () => { host.remove(); port.disconnect(); };
  port.onDisconnect.addListener(() => host.remove());
  host.onerror = close;
  host.onload = () => {
    try {
      host.contentWindow.lectioPlusAttachPort(port);
    } catch {
      close();
    }
  };
  document.body.append(host);
});
