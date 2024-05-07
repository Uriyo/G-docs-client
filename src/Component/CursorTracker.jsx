// import  { useEffect, useState } from 'react';
// import io from 'socket.io-client';

// const socket = io.connect('http://localhost:3001'); 

// function CursorTracker() {
//   const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  
//   useEffect(() => {
//     const handleMouseMove = (event) => {
//       setCursorPosition({
//         x: event.clientX,
//         y: event.clientY,
//       });
//       // Emit the cursor position to the server
//       socket.emit('cursorPositionChanged', { x: event.clientX, y: event.clientY });
//     };

//     window.addEventListener('mousemove', handleMouseMove);

//     return () => {
//       window.removeEventListener('mousemove', handleMouseMove);
//     };
//   }, []);

//   return (
//     <div>
//       <p>Mouse position: ({cursorPosition.x}, {cursorPosition.y})</p>
//     </div>
//   );
// }

// export default CursorTracker;
