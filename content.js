console.log('Content script loaded and running');

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
  browser.storage.sync.get(['names'], (result) => {
    const names = result.names || [];

    if (names.length === 0) {
      console.log('No names found in storage');
    }

    const cites = document.querySelectorAll('cite.fn');

    // Regex to find plain text URLs
    const urlRegex = /(http[s]?:\/\/.*?\.(?:jpg|jpeg|png|gif))/g;

    // Retrieve the list of names from storage and create the histogram
    browser.storage.sync.get(['names'], (result) => {
      const hiddenNames = result.names || [];

      if (hiddenNames.length === 0) {
        console.log('No hidden names found in storage');
      }

      // Create the histogram with hidden names
      createHistogram(nameCounts, hiddenNames);
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
      } else {
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
          const anchors = li.querySelectorAll('a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], a[href*=".gif"], a[href*="youtube.com/watch?v="], a[href*="youtu.be/"], a[href*="drive.google.com/file/d/"]');

          if (anchors.length > 0) {
            anchors.forEach(anchor => {
              const url = anchor.href;
              if (url.includes('youtube.com/watch?v=')) {
                const videoId = url.split('v=')[1].split('&')[0];
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                // Replace the text inside the anchor tag with an img tag with play button overlay
                anchor.innerHTML = `<div class="thumbnail-wrapper"><img src="${thumbnailUrl}" alt="YouTube thumbnail" class="youtube-thumbnail"><div class="play-button"></div></div>`;
              } else if (url.includes('youtu.be/')) {
                const videoId = url.split('be/')[1];
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                // Replace the text inside the anchor tag with an img tag with play button overlay
                anchor.innerHTML = `<div class="thumbnail-wrapper"><img src="${thumbnailUrl}" alt="YouTube thumbnail" class="youtube-thumbnail"><div class="play-button"></div></div>`;
              } else if (url.includes('drive.google.com/file/d/')) {
                const fileId = url.split('/d/')[1].split('/')[0];
                const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}`;
                // Replace the text inside the anchor tag with an img tag
                anchor.innerHTML = `<img src="${thumbnailUrl}" alt="${thumbnailUrl}" style="width: 100%; height: auto;">`;
              } else {
                // Replace the text inside the anchor tag with an img tag for other images
                anchor.innerHTML = `<img src="${url}" alt="Image preview" style="max-width: 100%; height: auto;">`;
              }
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

    // Add toggle buttons to nested comments
    addToggleButtons();
  });

  const textarea = document.getElementById('comment');
  const form = document.getElementById('commentform');

  if (textarea && form) {
    console.log("Amending form");

    // Create and add the buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.marginTop = '10px';

    const boldButton = createButton('B', 'b', 'font-weight: bold;');
    const italicButton = createButton('i', 'i', 'font-style: italic;');
    const blockquoteButton = createButton('"..."', 'blockquote');

    buttonsContainer.appendChild(boldButton);
    buttonsContainer.appendChild(italicButton);
    buttonsContainer.appendChild(blockquoteButton);

    // Insert buttons container after the textarea
    textarea.parentNode.insertBefore(buttonsContainer, textarea.nextSibling);

    textarea.addEventListener('mouseup', updateButtonState);
    textarea.addEventListener('keyup', updateButtonState);

    function updateButtonState() {
      const selectedText = getSelectedText(textarea);
      const enableButtons = selectedText.length > 0;
      boldButton.disabled = !enableButtons;
      italicButton.disabled = !enableButtons;
      blockquoteButton.disabled = !enableButtons;
    }
  }

  function createButton(text, tag, style = '') {
    const button = document.createElement('button');
    button.textContent = text;
    button.disabled = true;
    button.style.marginRight = '5px';
    if (style) {
      button.style.cssText += style;
    }

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const selectedText = getSelectedText(textarea);
      const wrappedText = `<${tag}>${selectedText}</${tag}>`;
      const unwrappedText = removeTags(selectedText, tag);

      if (selectedText.includes(`<${tag}>`) && selectedText.includes(`</${tag}>`)) {
        replaceSelectedText(textarea, unwrappedText);
      } else {
        replaceSelectedText(textarea, wrappedText);
      }
    });

    return button;
  }

  function getSelectedText(textarea) {
    return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
  }

  function replaceSelectedText(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = textarea.value.substring(0, start);
    const textAfter = textarea.value.substring(end);
    textarea.value = textBefore + text + textAfter;
    textarea.setSelectionRange(start, start + text.length);
    textarea.focus();
  }

  function removeTags(text, tag) {
    const regex = new RegExp(`<\/?${tag}>`, 'g');
    return text.replace(regex, '');
  }
}

function addNameToList(name) {
  browser.storage.sync.get(['names'], (result) => {
    let names = result.names || [];
    console.log('Current names in storage:', names);

    if (!names.includes(name)) {
      names.push(name);
      browser.storage.sync.set({ names }, () => {
        console.log(`Added ${name} to the list`);
        console.log('Updated names in storage:', names);
        updateNameListUI(names); // Call to update UI
      });
    }
  });
}

function updateNameListUI(names) {
  const nameListElement = document.getElementById('name-list');
  nameListElement.innerHTML = ''; // Clear existing list
  names.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    nameListElement.appendChild(li);
  });
}

function createHistogram(nameCounts, hiddenNames) {
  chrome.storage.sync.get(['showHistogram'], (result) => {
    if (result.showHistogram !== undefined && result.showHistogram) {
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

      Object.keys(nameCounts).forEach((name) => {
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
  });
}

function addToggleButtons() {
  const comments = document.querySelectorAll('li.comment');
  comments.forEach((comment) => {
    const children = comment.querySelector('ul.children');
    if (children) {
      const cite = comment.querySelector('cite.fn');
      if (cite) {
        // Create the toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = '➖'; // Initially minus sign (expanded)
        toggleButton.style.marginRight = '10px';
        toggleButton.addEventListener('click', () => {
          const commentBody = comment.querySelector('.comment-body');
          if (children.style.display === 'none') {
            children.style.display = '';
            toggleButton.textContent = '➖';
            commentBody.classList.remove('comment-body-collapsed');
          } else {
            children.style.display = 'none';
            toggleButton.textContent = '➕';
            commentBody.classList.add('comment-body-collapsed');
          }
        });

        // Insert the toggle button
        cite.parentNode.insertBefore(toggleButton, cite);
      }
    }
  });
}

// Add the CSS for the YouTube thumbnail overlay and collapsed comments
const style = document.createElement('style');
style.innerHTML = `
  .thumbnail-wrapper {
    position: relative;
    display: inline-block;
  }
  .youtube-thumbnail {
    display: block;
  }
  .play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 64px;
    height: 64px;
    background: url('https://upload.wikimedia.org/wikipedia/commons/e/e7/Play-button-icon.png') no-repeat center center;
    background-size: contain;
    pointer-events: none; /* Ensure the play button does not interfere with clicking the thumbnail */
  }
  .enhanced-image {
    max-width: 100%;
    height: auto;
    //filter: contrast(1.5) brightness(1.2) saturate(1.2);
    display: block;
  }
  .comment-body-collapsed :not(:first-of-type) {
    display: none;
  }
  .comment-body-collapsed::after {
    content: '...';
    display: block;
    background: white;
    padding-left: 10px;
  }
`;
document.head.appendChild(style);

