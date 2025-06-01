import { useEffect, useRef, useState } from 'react';
import './chat.css'
import EmojiPicker from 'emoji-picker-react';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useChatStore from '../../lib/chatStore';
import useUserStore from '../../lib/userStore';
import upload from '../../lib/uplode';
const formatCreatedAt = (createdAtRaw) => {
  if (!createdAtRaw) return "";
  const createdAt = createdAtRaw.seconds
    ? new Date(createdAtRaw.seconds * 1000)
    : new Date(createdAtRaw);
  const now = new Date();
  const diffMs = now - createdAt;
  const diffHrs = diffMs / (1000 * 60 * 60);
  if (diffHrs > 24) {
    const daysAgo = Math.floor(diffHrs / 24);
    if (daysAgo < 7) {
      return createdAt.toLocaleDateString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    } else {
      return createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  } else {
    return createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

const Chat = () => {
const [loading, setLoading] = useState(true);
const [chat,setChat] =useState()  
const [open,setOpen] =useState(false)
const [text,setText] =useState("")
const[img,setImg] = useState({
  file:null,
  url:"",
})
const [isSending, setIsSending] = useState(false);
const endRef = useRef(null)
const {showDetails, setShowDetails, chatId, user, isCurrentUserBlocked, isReceiverBlocked} = useChatStore();
const {currentUser} = useUserStore();

useEffect(() => {
  // Wait for images to load before scrolling
  if (!chat?.messages || chat.messages.length === 0) {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  const images = Array.from(document.querySelectorAll('.center .message img'));
  if (images.length === 0) {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  let loaded = 0;
  const handleLoad = () => {
    loaded += 1;
    if (loaded === images.length) {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200); // small delay for smoothness
    }
  };

  images.forEach(img => {
    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleLoad);
    }
  });

  // Cleanup listeners
  return () => {
    images.forEach(img => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleLoad);
    });
  };
}, [chat?.messages]);

useEffect(()=>{
  setLoading(true);
  const unSub = onSnapshot(
    doc(db,"chats",chatId),
    (res)=>{
    setChat(res.data());
    setLoading(false);

    // Mark as seen when chat is opened
    if (chatId && currentUser?.id && user?.id) {
      const userChatsRef = doc(db, "userchats", currentUser.id);
      getDoc(userChatsRef).then((userChatsSnapshot) => {
        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex(c => c.chatId === chatId);
          if (chatIndex !== -1 && !userChatsData.chats[chatIndex].isSeen) {
            userChatsData.chats[chatIndex].isSeen = true;
            updateDoc(userChatsRef, { chats: userChatsData.chats });
          }
        }
      });
    }
    }
  );
  return()=>{
    unSub();
  };

},[chatId, currentUser?.id, user?.id]);
// console.log(chat)

const handleEmoji= (e) =>{
  setText(prev=>prev+e.emoji)
  setOpen(false)
  
};
const handleImg = (e) => {
  if(e.target.files[0]){
    setImg({
      file: e.target.files[0],
      url: URL.createObjectURL(e.target.files[0]),
    })
  }
}
const handleSend= async () =>{
if (isSending || !text.trim()) return; // Prevent double send or empty
setIsSending(true);
try {
  let imgUrl = null;
  if(img.file){
    imgUrl= await upload(img.file)
  }
//   if (!currentUser || !currentUser.id) {
//   console.error("currentUser or currentUser.id is undefined");
//   return;
// }
  await updateDoc(doc(db,"chats",chatId),{
    messages:arrayUnion({
      senderId: currentUser.id,
      text,
      createdAt: new Date(),
      ...(imgUrl && { img : imgUrl }),
    })
  });

  const userIDs = [currentUser.id,user.id];
  userIDs.forEach(async (id)=>{
  const userChatsRef = doc(db,"userchats",id)
  const userChatsSnapshot = await getDoc(userChatsRef)

  if (userChatsSnapshot.exists()){
    const userChatsData = userChatsSnapshot.data()
    const chatIndex = userChatsData.chats.findIndex(c=>c.chatId === chatId)
    userChatsData.chats[chatIndex].lastMessage = text; 
    userChatsData.chats[chatIndex].isSeen = id ===currentUser.id ? true:false;
    userChatsData.chats[chatIndex].updatedAt = Date.now();

    await updateDoc(userChatsRef,{
      chats: userChatsData.chats,
    })


  }});
  setText(""); // Clear input after send
} catch (error) {
  console.log(error.message)
  
} finally {
  setIsSending(false);
}

setImg({
  file:null,
  url:"",
});
setText("")

  
}


  if (loading) {
    return (
      <div className="chat chat-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className='chat'>
      <div className='top'>
        <div className='user'>
          <img src={user?.avatar || "/avatar.png"} alt="" />
          <div className='texts'>
            <span>{(isCurrentUserBlocked || isReceiverBlocked) ? "User" : (user?.username || "Unknown")}</span>
            <p>Hey! i am using Witty..</p>
          </div>
        </div>
        <div className='icons'>
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" onClick={() => setShowDetails(!showDetails)} />
        </div>
      </div>
      <div className='center'>
        {chat?.messages?.map((message) => {
          // console.log('senderId:', message.senderId, 'currentUser:', currentUser?.id);
            return (
            <div className={message.senderId === currentUser?.id ? "message own" : "message"} key={message?.createdAt || Math.random()}>
              <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              <p>{message.text}</p>
              <span>
                {formatCreatedAt(message.createdAt)}
              </span>
              </div>
            </div>
            );
        })}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        
        <div ref={endRef}></div>
      </div>
      <div className='bottom'>
        <div className='icons'>
          <label htmlFor="file">
          <img src="./img.png" alt="" /></label>
          <input type="file" name="" id="file" style={{display:"none",}} onChange={handleImg} disabled={isCurrentUserBlocked || isReceiverBlocked} />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
      <input
        type="text"
        placeholder={
          (isCurrentUserBlocked || isReceiverBlocked)
            ? (isCurrentUserBlocked ? "You are Blocked" : "UnBlock to Chat")
            : 'Type a message..'
        }
        onChange={e => setText(e.target.value)}
        value={text}
        disabled={isCurrentUserBlocked || isReceiverBlocked || isSending}
        onKeyDown={e => {
          if (
            e.key === "Enter" &&
            !isCurrentUserBlocked &&
            !isReceiverBlocked
          ) {
            handleSend();
          }
        }}
      />
        <div className='emoji'>
          <img src="./emoji.png" alt="" onClick={()=> setOpen(prev=>!prev)}/>
          <div className='picker'><EmojiPicker open={open} onEmojiClick={handleEmoji}/></div>
        </div>
        <button
          className='sendButton'
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked || isSending}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chat