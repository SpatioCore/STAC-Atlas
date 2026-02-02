module.exports = {
  // Helper functions for Artillery template variables
  $randomNumber: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  $randomPick: function(...items) {
    return items[Math.floor(Math.random() * items.length)];
  }
};
