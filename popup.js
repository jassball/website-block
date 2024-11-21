const siteInput = document.getElementById("site-input");
const addButton = document.getElementById("add-button");
const blockedSitesList = document.getElementById("blocked-sites");

// Load and display all blocked sites
function loadBlockedSites() {
  chrome.storage.local.get("blockedSites", (data) => {
    const sites = data.blockedSites || [];
    blockedSitesList.innerHTML = ""; // Clear the list

    // Add each site as a list item
    sites.forEach((site, index) => {
      const li = document.createElement("li");
      li.textContent = site;

      // Add a remove button for each site
      const removeButton = document.createElement("button");
      removeButton.textContent = "Remove";
      removeButton.style.marginLeft = "10px";
      removeButton.onclick = () => removeBlockedSite(index);

      li.appendChild(removeButton);
      blockedSitesList.appendChild(li);
    });
  });
}

// Add a new blocked site
function addBlockedSite() {
  const site = siteInput.value.trim();
  if (!site) return;

  chrome.storage.local.get("blockedSites", (data) => {
    const sites = data.blockedSites || [];
    if (!sites.includes(site)) {
      sites.push(site); // Add the new site
      chrome.storage.local.set({ blockedSites: sites }, () => {
        siteInput.value = ""; // Clear input field
        loadBlockedSites(); // Refresh the list
        addDynamicRule(site); // Add a blocking rule
      });
    }
  });
}

// Remove a blocked site
function removeBlockedSite(index) {
  chrome.storage.local.get("blockedSites", (data) => {
    const sites = data.blockedSites || [];
    const [removedSite] = sites.splice(index, 1); // Remove site at index
    chrome.storage.local.set({ blockedSites: sites }, () => {
      loadBlockedSites(); // Refresh the list
      removeDynamicRule(removedSite); // Remove the blocking rule
    });
  });
}

// Add a dynamic rule for the site
function addDynamicRule(site) {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    const existingIds = rules.map((rule) => rule.id);
    const newId = existingIds.length ? Math.max(...existingIds) + 1 : 1;

    chrome.declarativeNetRequest.updateDynamicRules(
      {
        addRules: [
          {
            id: newId,
            priority: 1,
            action: { type: "block" },
            condition: {
              urlFilter: `*://*.${site}/*`,
              resourceTypes: ["main_frame"],
            },
          },
        ],
        removeRuleIds: [],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error adding rule:", chrome.runtime.lastError);
        } else {
          console.log(`Blocking rule added for ${site}`);
        }
      }
    );
  });
}

// Remove a dynamic rule for the site
function removeDynamicRule(site) {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    const matchingRules = rules.filter((rule) =>
      rule.condition.urlFilter.includes(site)
    );
    const ruleIdsToRemove = matchingRules.map((rule) => rule.id);

    chrome.declarativeNetRequest.updateDynamicRules(
      {
        addRules: [],
        removeRuleIds: ruleIdsToRemove,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error removing rule:", chrome.runtime.lastError);
        } else {
          console.log(`Blocking rule removed for ${site}`);
        }
      }
    );
  });
}

// Event listener for the Add button
addButton.addEventListener("click", addBlockedSite);

// Initial load of blocked sites
loadBlockedSites();
