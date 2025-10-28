const { formatTimestamp } = require('./dateUtils');

const generateDelta = (localData, remoteData, lastSyncTimestamp) => {
  const delta = {
    added: [],
    updated: [],
    deleted: []
  };


  for (const localItem of localData) {
    const remoteItem = remoteData.find(r => r.id === localItem.id);
    if (!remoteItem) {

      if (new Date(localItem.updatedAt) > new Date(lastSyncTimestamp)) {
        delta.added.push(localItem);
      }
    } else if (new Date(localItem.updatedAt) > new Date(remoteItem.updatedAt)) {

      delta.updated.push(localItem);
    }
  }

  for (const remoteItem of remoteData) {
    if (!localData.find(l => l.id === remoteItem.id)) {
      delta.deleted.push(remoteItem.id);
    }
  }

  return delta;
};

const applyDelta = (currentData, delta) => {
  let updatedData = [...currentData];

  // Apply additions
  updatedData = [...updatedData, ...delta.added];

  // Apply updates
  for (const update of delta.updated) {
    updatedData = updatedData.map(item =>
      item.id === update.id ? { ...update, updatedAt: formatTimestamp() } : item
    );
  }

  // Apply deletions
  updatedData = updatedData.filter(item => !delta.deleted.includes(item.id));

  return updatedData;
};

const resolveConflict = (localItem, remoteItem) => {
  return new Date(localItem.updatedAt) > new Date(remoteItem.updatedAt)
    ? localItem
    : remoteItem;
};

module.exports = {
  generateDelta,
  applyDelta,
  resolveConflict
};
