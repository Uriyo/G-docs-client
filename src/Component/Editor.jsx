import  { useCallback, useEffect, useState } from "react";
import "quill/dist/quill.snow.css";
import Quill from "quill";
import QuillCursors from 'quill-cursors';

import '../App.css';

import {useParams} from 'react-router-dom'

import {io} from 'socket.io-client'
const SAVE_INTERVAL=2000
const TOOLBAR_OPTIONS = [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],
  ['link', 'image', 'formula'],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean'] 
]

Quill.register('modules/cursors', QuillCursors);

const Editor = () => {
  const {id:documentId} = useParams()
  const [socket,setSocket]=useState()
  const [quill,setQuill]=useState()
  const[socketId,setSocketId]=useState()
  const [cursorPosition,setCursorPosition]=useState();

//socket connection
useEffect(()=>{
    const s=io("http://localhost:3001")
    setSocket(s)
    
    s.on("connect", () => {
      console.log("Connected to the server");
      setSocketId(s.id); // Set the socket.id once the connection is established
    });

    
    return()=>{
      s.disconnect()
    }
  },[])

//mouse position
useEffect(() => {
  if (!socket ) return;

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    socket.emit('mouseActivity', { x: clientX, y: clientY });
  };

  document.addEventListener('mousemove', handleMouseMove);
  
  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    
  };
}, [socket]);

//emitting mouse position
useEffect(() => {
  if (!socket) return;

  const handleMouseActivity = (data) => {
    const cursorElement = document.getElementById(`cursor-${socket.id}`);
    console.log(socket.id)
    if (cursorElement) {
      cursorElement.style.left = `${data.x}px`;
      cursorElement.style.top = `${data.y}px`;
    }
  };

  socket.on("mouseActivity", handleMouseActivity);

  return () => {
    socket.off("mouseActivity", handleMouseActivity);
  };
}, [socket]);

//load document
  useEffect(()=>{
    if(!socket || !documentId) return;
    socket.emit('get-document',documentId)

    socket.once("load-document",document=>{
      quill.setContents(document)
      quill.enable()
    })
    return () => {
      socket.off('load-document');
    };
  },[socket,quill,documentId])

  // sendText
  useEffect(()=>{
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("sendChanges", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  },[socket,quill])

  useEffect(() => {
    if (!socket || !quill) return;
    const cursors = quill.getModule('cursors');
    const cursor = cursors.createCursor(socketId, `User ${socketId}`, 'blue');

    socket.on('cursorPosition', (data) => {
      if (data.source !== socketId) {
        cursors.moveCursor(data.source, data.range);
      }
    });

    quill.on('selection-change', (range, oldRange, source) => {
      if (range && source === 'user') {
        socket.emit('cursorPosition', { range, source: socketId });
      }
    });

    return () => {
      socket.off('cursorPosition');
      quill.off('selection-change');
    };
 }, [socket, quill]);

 useEffect(() => {
  if (!socket) return;
 
  const handleCursorPosition = (data) => {
     if (data.source !== socketId) { // Ignore updates from the current user
       const cursors = quill.getModule('cursors');
       cursors.moveCursor(data.source, data.range);
     }
  };
 
  socket.on("cursorPosition", handleCursorPosition);
 
  return () => {
     socket.off("cursorPosition", handleCursorPosition);
  };
 }, [socket, quill, socketId]);

  // recieveText
  useEffect(()=>{
    if(socket==null || quill==null) return

    const handler=(delta)=>{
      quill.updateContents(delta)
    }
    socket.on("recieveChanges",handler)
    
    return()=>{
      socket.off('recieveChanges',handler)
    }
  },[socket,quill])

  //save document
  useEffect(()=>{
    if(socket==null || quill==null) return
    const interval=setInterval(()=>{
      socket.emit('save-document',quill.getContents())
    },SAVE_INTERVAL)

    return ()=>{
      clearInterval(interval)
    }

  },[socket,quill])


 const wrapperRef= useCallback((wrapper) => {
  if(wrapper== null) return

  wrapper.innerHTML=""
      const editor = document.createElement('div');
      wrapper.append(editor);
      const q = new Quill(editor, {
        theme: "snow",
        modules: { 
          toolbar: TOOLBAR_OPTIONS,
          cursors: {
            
            hideDelayMs: 5000,
            hideSpeedMs: 0,
            selectionChangeSource: null,
            transformOnTextChange: true,
          } ,  // enable cursor styles
         },
      });
      q.enable(false);
      q.setText("Loading...");
      setQuill(q);

  }, []);

  return (
    <>
      <div
        className="editor"
        id="container"
        ref={wrapperRef}
      >
      </div>
      <div
        className="cursor"
        id={`cursor-${socketId}`}
      ></div>
      </>
  );
};

export default Editor;

