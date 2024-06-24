// Check if the document is already loaded
if (document.readyState === 'loading') {
  // Document is still loading, wait for the DOMContentLoaded event
  document.addEventListener('DOMContentLoaded', processDivs);
} else {
  // Document is already loaded, run the function directly
  processDivs();
}

function processDivs() {

  // Collect names and their counts
  const nameCounts = {};

  // Find all cite elements
  const cites = document.querySelectorAll('cite.fn');
  cites.forEach(cite => {
    const name = cite.textContent.trim();
    if (name) {
      if (!nameCounts[name]) {
        nameCounts[name] = 0;
      }
      nameCounts[name]++;
    }
  });

  console.log(nameCounts);


  // Retrieve the list of names from storage
  chrome.storage.sync.get(['names'], (result) => {

    const names = result.names || [];

    if (names.length === 0) {
      console.log('No names found in storage');
    }

    const cites = document.querySelectorAll('cite.fn');

    // Regex to find plain text URLs
    const urlRegex = /(http[s]?:\/\/.*?\.(?:jpg|jpeg|png|gif))/g;

    // Retrieve the list of names from storage and create the histogram
    chrome.storage.sync.get(['names'], (result) => {

      const hiddenNames = result.names || [];

      if (hiddenNames.length === 0) {
        console.log('No hidden names found in storage');
      }

      // Create the histogram with hidden names
      createHistogram(nameCounts, names);
    });

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
      } 
      else {

        // Add a button next to the name to add it to the persistent list
        const addButton = document.createElement('button');
        addButton.textContent = 'Mute';
        addButton.style.marginLeft = '10px';
        addButton.addEventListener('click', () => addNameToList(citeText));
        cite.parentNode.appendChild(addButton);

        // Traverse up the DOM to find the closest li ancestor and remove it
        const li = cite.closest('li.comment');
        
        if (li) {
        
            // Find all anchor tags within the cite element
            const anchors = li.querySelectorAll('a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], a[href*=".gif"]');
            
            if (anchors.length > 0) {
                
                anchors.forEach(anchor => {
                
                  const url = anchor.href;
                  // Replace the text inside the anchor tag with an img tag
                  anchor.innerHTML = `<img src="${url}" alt="Image preview" style="max-width: 100%; height: auto;">`;
                });
            }
        }
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

function createHistogram(nameCounts, hiddenNames) {

  console.log('Creating histogram');

  const histogramContainer = document.createElement('div');
  histogramContainer.style.marginTop = '20px';
  histogramContainer.style.padding = '10px';
  histogramContainer.style.border = '1px solid #ccc';
  histogramContainer.style.backgroundColor = '#f9f9f9';

  const title = document.createElement('h3');
  title.textContent = 'Commenter Activity';
  histogramContainer.appendChild(title);

  const maxCount = Math.max(...Object.values(nameCounts));

  Object.keys(nameCounts).forEach(name => {
    const barContainer = document.createElement('div');
    barContainer.style.display = 'flex';
    barContainer.style.alignItems = 'center';
    barContainer.style.marginBottom = '5px';

    const nameLabel = document.createElement('div');
    nameLabel.style.width = '150px';
    nameLabel.textContent = name;
    barContainer.appendChild(nameLabel);

    const bar = document.createElement('div');
    bar.style.height = '20px';
    bar.style.width = `${(nameCounts[name] / maxCount) * 100}%`;
    bar.style.backgroundColor = hiddenNames.includes(name) ? '#ff4c4c' : '#4caf50'; // Red for hidden users, green for others
    bar.style.textAlign = 'right';
    bar.style.paddingRight = '5px';
    bar.style.color = 'white';
    barContainer.appendChild(bar);

    const countLabel = document.createElement('div');
    countLabel.style.marginLeft = '10px';
    countLabel.textContent = nameCounts[name];
    barContainer.appendChild(countLabel);

    histogramContainer.appendChild(barContainer);
  });

  // Append the histogram to a specific element or at the end of the body
  const commentsSection = document.querySelector('#respond') || document.body;
  commentsSection.appendChild(histogramContainer);
}
