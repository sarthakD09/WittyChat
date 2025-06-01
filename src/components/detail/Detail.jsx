import { arrayRemove, arrayUnion, doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import useUserStore from '../../lib/userStore';
import useChatStore from '../../lib/chatStore';
import { format } from 'date-fns'; // npm install date-fns
import './detail.css'
import { useEffect, useState } from 'react';

const Detail = () => {
  const {chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock} = useChatStore();
  const {currentUser} = useUserStore();
  const [chat, setChat] = useState(null);

  // Fetch chat messages for shared photos
  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, "chats", chatId), (docSnap) => {
      setChat(docSnap.data());
    });
    return () => unsub();
  }, [chatId]);

  const handleBlock = async()=>{
    if (!user) return;

  try {
    const userDocRef = doc(db,"users",currentUser.id);
    const otherUserChatsRef = doc(db, "userchats", user.id);

    await updateDoc(userDocRef,{
      blocked: isReceiverBlocked? arrayRemove(user.id) : arrayUnion(user.id)
    });
    // This will update a field in the other user's userchats document, triggering their onSnapshot
    await updateDoc(otherUserChatsRef, {
      lastBlockUpdate: serverTimestamp()
    });
    changeBlock();
    
  } catch (error) {
    console.log(error.message)
    
  }
  }

  // Get all image messages
  const sharedPhotos = chat?.messages?.filter(msg => msg.img);

  return (
    <div className='detail'>
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h2>{(isCurrentUserBlocked || isReceiverBlocked) ? "User" : (user?.username || "Unknown")}</h2>
        <p>Hey! i am using Witty..</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>privacy & Help</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Photos</span>
            <img src="./arrowDown.png" alt="" />
          </div>
          <div className="photos">
            {sharedPhotos && sharedPhotos.length > 0 ? (
              sharedPhotos.map((msg, idx) => (
                <div className="photoItem" key={msg.img + idx}>
                  <div className="photoDetail">
                    <img src={msg.img} alt="shared" />
                    <span>
                      {msg.fileName || "Image"}<br />
                      <small>
                        {msg.createdAt && !isNaN(Date.parse(msg.createdAt))
                          ? format(new Date(msg.createdAt), 'PPpp')
                          : "No time"}
                      </small>
                    </span>
                  </div>
                  <a href={msg.img} download target="_blank" rel="noopener noreferrer">
                    <img src="./download.png" alt="Download" className='icon'/>
                  </a>
                </div>
              ))
            ) : (
              <span style={{color: "#aaa"}}>No shared photos yet.</span>
            )}
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <button onClick={handleBlock}>{isCurrentUserBlocked? "You are Blocked" : isReceiverBlocked ? "User is Blocked" : "Block User"}</button>
        <button className='logout' onClick={()=>auth.signOut()}>Logout</button>
      </div>
      
    </div>
  );
};

export default Detail;