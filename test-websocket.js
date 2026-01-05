const io = require('socket.io-client');

console.log('Testing WebSocket connection to timeline gateway...');

// Test root namespace
const socket = io('ws://localhost:3000', {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ Connected to root namespace');
  socket.disconnect();

  // Test timeline namespace
  console.log('Testing timeline namespace...');
  const timelineSocket = io('ws://localhost:3000/timeline', {
    transports: ['websocket', 'polling'],
    timeout: 5000
  });

  timelineSocket.on('connect', () => {
    console.log('✅ Connected to timeline namespace');

    // Test listening for events
    timelineSocket.on('newEvent', (event) => {
      console.log('📨 Received newEvent:', event);
    });

    timelineSocket.on('updatedEvent', (event) => {
      console.log('📨 Received updatedEvent:', event);
    });

    timelineSocket.on('deletedEvent', (eventId) => {
      console.log('📨 Received deletedEvent:', eventId);
    });

    console.log('🎧 Listening for timeline events... (press Ctrl+C to exit)');
  });

  timelineSocket.on('connect_error', (error) => {
    console.log('❌ Timeline namespace connection failed:', error.message);
    timelineSocket.disconnect();
    process.exit(1);
  });

  timelineSocket.on('disconnect', () => {
    console.log('📴 Disconnected from timeline namespace');
  });
});

socket.on('connect_error', (error) => {
  console.log('❌ Root namespace connection failed:', error.message);
  socket.disconnect();
  process.exit(1);
});