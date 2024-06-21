/**
 This file contains click listeners or event handlers of elements in popup.html
 You can add the logic to take some action on particular event
*/

document.addEventListener('DOMContentLoaded', () => {
  const nameList = document.getElementById('name-list');
  const nameInput = document.getElementById('name-input');
  const addNameButton = document.getElementById('add-name');

  // Load the names from storage
  chrome.storage.sync.get(['names'], (result) => {
    const names = result.names || [];
    names.forEach(name => addNameToList(name));
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
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
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
});

