import { useEffect, useId, useState } from 'react'
import './chatList.css'
import AddUser from './add-user/addUser';
import useUserStore from '../../../lib/userStore';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import useChatStore from '../../../lib/chatStore';

const ChatList = () => {
  const [chats,setChats] = useState([])
  const [addMode,setAddMode] = useState(false)
  const [input,setInput] = useState("");
  const {currentUser} = useUserStore()
  const {changeChat} = useChatStore();
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState(null);

  useEffect(()=>{
    setLoading(true);
    const unSub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
      const items = res.data().chats;

      const promises = items.map(async (item) => {
        const userDocRef = doc(db, "users", item.receiverId);
        const userDocSnap = await getDoc(userDocRef);
        const user = userDocSnap.data();
        return { ...item, user };
      });

      const chatData = await Promise.all(promises);
      setChats(chatData.sort((a,b)=> b.updatedAt - a.updatedAt ));
      setLoading(false);
    });

    return () => {
      unSub();
    };
    
  },[currentUser.id]);
  if (loading) {
    return (
      <div className="chatList loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const handleSelect = async (chat)=>{
    setSelectedChatId(chat.chatId); // Mark as selected/loading
    const userChats = chats.map((item)=>{
      const{user,...rest} = item;
      return rest;
    });
    const chatIndex = userChats.findIndex(item=>item.chatId===chat.chatId);
    userChats[chatIndex].isSeen = true;
    
    const userChatsRef = doc(db,"userchats",currentUser.id);
    try {
      await updateDoc(userChatsRef,{
        chats:userChats,
      })
      changeChat(chat.chatId,chat.user)
    } catch (err) {
      console.log(err);
      
    } finally {
      setSelectedChatId(null); // Reset after loading if needed
    }

  }
  const filteredChat = chats.filter(c=>c.user.username.toLowerCase().includes(input.toLowerCase()))
  return (
    <div className='chatList'>
      <div className='search'>
        <div className='searchBar'>
          <img src="./search.png" alt="" />
          <input type="text" placeholder='Search' onChange={(e)=>setInput(e.target.value)} />
        </div>
        <img src={addMode ? "./minus.png":"./plus.png"} alt="add-user" className='add' onClick={() => setAddMode((prev) => !(prev))}/>
      </div>
      {filteredChat.map((chat) => (
        <div
          className={`item${selectedChatId === chat.chatId ? " loading" : ""}`}
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
            pointerEvents: selectedChatId && selectedChatId !== chat.chatId ? "none" : "auto"
          }}
        >
          <img src={chat.user.blocked.includes(currentUser.id) ? "./avatar.png" : (chat.user?.avatar || "./avatar.png")} alt="" />
          <div className='texts'>
            <span>{chat.user.blocked.includes(currentUser.id) ? "User" : (chat.user?.username || "Unknown")}</span>
            <p>
              {chat.lastMessage && chat.lastMessage.length > 40
                ? chat.lastMessage.slice(0, 40) + "..."
                : chat.lastMessage}
            </p>
          </div>
          <div className="spinner-space">
            {selectedChatId === chat.chatId && <div className="mini-spinner"></div>}
          </div>
        </div>
      ))}
      {addMode && <AddUser/>}
    </div>
  );
};

export default ChatList;