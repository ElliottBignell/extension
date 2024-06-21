// Check if the document is already loaded
if (document.readyState === 'loading') {
  // Document is still loading, wait for the DOMContentLoaded event
  document.addEventListener('DOMContentLoaded', processDivs);
} else {
  // Document is already loaded, run the function directly
  processDivs();
}

function processDivs() {
  // Retrieve the list of names from storage
  chrome.storage.sync.get(['names'], (result) => {
    const names = result.names || [];

    if (names.length === 0) {
      console.log('No names found in storage');
    }

    const cites = document.querySelectorAll('cite.fn');
    console.log('List of all cite tags:', cites);

    // Iterate through all cite elements
    cites.forEach((cite, index) => {
      // Check if the cite element contains any of the names in the list
      const citeText = cite.textContent;
      if (names.some(name => citeText.includes(name))) {
        // Traverse up the DOM to find the closest li ancestor and remove it
        const li = cite.closest('li.comment');
        if (li) {
          li.remove();
        }
      } else {
        // Add a button next to the name to add it to the persistent list
        const addButton = document.createElement('button');
        addButton.textContent = 'Mute';
        addButton.style.marginLeft = '10px';
        addButton.addEventListener('click', () => addNameToList(citeText));
        cite.parentNode.appendChild(addButton);
      }
    });

    // Optionally, you can do something with the list of divs, e.g., display it in a popup or alert
    let divList = '';
    const divs = document.querySelectorAll('div');
    divs.forEach((div, index) => {
      divList += `Div ${index + 1}: ${div.outerHTML}\n`;
    });
  });
}

function addNameToList(name) {
  chrome.storage.sync.get(['names'], (result) => {
    const names = result.names || [];
    if (!names.includes(name)) {
      names.push(name);
      chrome.storage.sync.set({ names }, () => {
        console.log(`Added ${name} to the list`);
        // Optionally, you could provide some feedback to the user here, like disabling the button
      });
    }
  });
}
