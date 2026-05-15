// Renderer entry point
// All business logic stays in the main process (D-15)

// Listen for app ready event from main process
window.electron.on('app:ready', () => {
  console.log('App is ready');
});
