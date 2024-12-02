chrome.runtime.onInstalled.addListener(() => {
  console.log("Website Blocker is installed!");
});

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    console.log(`Blocking request to: ${details.url}`);
    return { cancel: true }; // Block the request
  },
  async function () {
    // Retrieve the blocked sites from storage
    const data = await chrome.storage.local.get("blockedSites");
    const blockedSites = data.blockedSites || [];
    console.log("Blocked sites:", blockedSites);

    // Return the URLs to block
    return { urls: blockedSites.map((site) => `*://*.${site}/*`) };
  },
  ["blocking"] // Indicates the listener will block matching requests
);
