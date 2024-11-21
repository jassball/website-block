let blockedSites = ["https://www.vg.no/", "twitter.com"];

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    return { cancel: true };
  },
  {
    urls: blockedSites.map((site) => `*://*.${site}/*`),
  },
  ["blocking"]
);

chrome.runtime.onInstalled.addListener(() => {
  console.log("Website Blocker is installed!");
});
