chrome.runtime.onInstalled.addListener(() => {
  // Initialize the list of names
  const initialNames = ["Swenson", "Clint R"];
  chrome.storage.sync.set({ names: initialNames }, () => {
    console.log('The initial list of names has been set.');
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status == 'complete' && tab.active) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      var activeTab = tabs[0];
      var activeTabUrl = activeTab.url;

      if (activeTabUrl.startsWith("https://www.drroyspencer.com/")) {
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          function: manipulateDOM
        });
      }
    });
  }
});

function manipulateDOM() {
  var all = document.getElementsByTagName('cite');
  var searchValue = "Swenson";

  for (var i = 0; i < all.length; i++) {
    if (all[i].innerHTML.indexOf(searchValue) > -1) {
      all[i].innerHTML = "";
    }
  }
}
