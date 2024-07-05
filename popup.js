document.addEventListener('DOMContentLoaded', () => {
  const nameList = document.getElementById('name-list');
  const nameInput = document.getElementById('name-input');
  const addNameButton = document.getElementById('add-name');
  const histogramCheckbox = document.getElementById('histogram');
  const fontCheckbox = document.getElementById('font');  
  const filterCheckbox = document.getElementById('filter');

  // Load the names from storage
  chrome.storage.sync.get(['names', 'showHistogram', 'showFont', 'filter'], (result) => {
    const names = result.names || [];
    names.forEach(name => addNameToList(name));

    // Set the checkbox state based on the stored value
    histogramCheckbox.checked = result.showHistogram || false;
    fontCheckbox.checked = result.showFont || false;
    filterCheckbox.checked = result.filter || false;
  });

  // Add a new name to the list
  addNameButton.addEventListener('click', () => {
    const newName = nameInput.value.trim();
    if (newName) {
      chrome.storage.sync.get(['names'], (result) => {
        const names = result.names || [];
        if (!names.includes(newName)) {
          names.push(newName);
          chrome.storage.sync.set({ names }, () => {
            addNameToList(newName);
            nameInput.value = '';
          });
        }
      });
    }
  });

  // Add a name to the list in the UI
  function addNameToList(name) {
    const li = document.createElement('li');
    li.textContent = name;
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Unmute';
    removeButton.className = 'btn btn-danger btn-sm';
    removeButton.addEventListener('click', () => {
      chrome.storage.sync.get(['names'], (result) => {
        const names = result.names || [];
        const updatedNames = names.filter(n => n !== name);
        chrome.storage.sync.set({ names: updatedNames }, () => {
          li.remove();
        });
      });
    });
    li.appendChild(removeButton);
    nameList.appendChild(li);
  }

  // Update storage when checkbox is clicked
  histogramCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ showHistogram: histogramCheckbox.checked });
  }); 
  
  fontCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ showFont: fontCheckbox.checked });
  });  

  filterCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ filter: filterCheckbox.checked });
  });  

  const usernameInput = document.getElementById('username-input');
  const saveUsernameButton = document.getElementById('save-username');
  const trackUserInput = document.getElementById('track-user-input');
  const addTrackUserButton = document.getElementById('add-track-user');
  const trackUsersList = document.getElementById('track-users-list');
  const applyFiltersButton = document.getElementById('apply-filters');
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');

  // Load stored data
  chrome.storage.sync.get(['username', 'trackUsers', 'startDate', 'endDate'], (result) => {
    usernameInput.value = result.username || '';
    startDateInput.value = result.startDate || '';
    endDateInput.value = result.endDate || '';
    const trackUsers = result.trackUsers || [];
    trackUsers.forEach(user => addTrackUserToList(user));
  });

  saveUsernameButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
      chrome.storage.sync.set({ username }, () => {
        console.log(`Username saved: ${username}`);
      });
    }
  });

  addTrackUserButton.addEventListener('click', () => {
    const trackUser = trackUserInput.value.trim();
    if (trackUser) {
      chrome.storage.sync.get(['trackUsers'], (result) => {
        const trackUsers = result.trackUsers || [];
        if (!trackUsers.includes(trackUser)) {
          trackUsers.push(trackUser);
          chrome.storage.sync.set({ trackUsers }, () => {
            addTrackUserToList(trackUser);
            trackUserInput.value = '';
          });
        }
      });
    }
  });

  function addTrackUserToList(user) {
    const li = document.createElement('li');
    li.textContent = user;
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.className = 'btn btn-danger btn-sm';
    removeButton.addEventListener('click', () => {
      chrome.storage.sync.get(['trackUsers'], (result) => {
        const trackUsers = result.trackUsers || [];
        const updatedTrackUsers = trackUsers.filter(u => u !== user);
        chrome.storage.sync.set({ trackUsers: updatedTrackUsers }, () => {
          li.remove();
        });
      });
    });
    li.appendChild(removeButton);
    trackUsersList.appendChild(li);
  }

  applyFiltersButton.addEventListener('click', () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    chrome.storage.sync.set({ startDate, endDate }, () => {
      console.log(`Filters applied: ${startDate} - ${endDate}`);
      // You can call a function here to apply the filters on the blog page
    });
  });
});

