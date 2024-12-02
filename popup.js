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
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.marginBottom = "5px";
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
  if (!site || !/^([\w-]+\.)+[\w-]+$/.test(site)) {
    console.error("Invalid website format");
    return;
  }

  chrome.storage.local.get("blockedSites", (data) => {
    const sites = data.blockedSites || [];
    if (!sites.includes(site)) {
      sites.push(site);

      // Save the updated list to storage
      chrome.storage.local.set({ blockedSites: sites }, () => {
        console.log("Blocked sites updated:", sites);
        siteInput.value = ""; // Clear input field
        loadBlockedSites(); // Refresh the list in the UI
        addDynamicRule(site); // Add a dynamic blocking rule
      });
    } else {
      console.log(`${site} is already blocked.`);
    }
  });
}

// Remove a blocked site
function removeBlockedSite(index) {
  chrome.storage.local.get("blockedSites", (data) => {
    const sites = data.blockedSites || [];
    const [removedSite] = sites.splice(index, 1);

    chrome.storage.local.set({ blockedSites: sites }, () => {
      loadBlockedSites(); // Refresh the list
      removeDynamicRule(removedSite); // Remove the blocking rule
    });
  });
}

// Add a dynamic rule for the site
function addDynamicRule(site) {
  const urlFilter = site.startsWith("www.")
    ? `*://${site}/*`
    : `*://*.${site}/*`;

  console.log(`Adding dynamic rule with urlFilter: ${urlFilter}`);

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
              urlFilter,
              resourceTypes: ["main_frame"],
            },
          },
        ],
        removeRuleIds: [],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error adding rule:", chrome.runtime.lastError.message);
        } else {
          console.log(`Dynamic rule added for ${site}`);
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

    if (ruleIdsToRemove.length === 0) {
      console.warn(`No dynamic rules found for ${site}`);
      return;
    }

    chrome.declarativeNetRequest.updateDynamicRules(
      {
        addRules: [],
        removeRuleIds: ruleIdsToRemove,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error removing rule:",
            chrome.runtime.lastError.message
          );
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
