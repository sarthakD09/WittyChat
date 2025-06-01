import { useEffect } from "react";
import Chat from "./components/chat/Chat"
import Detail from "./components/detail/Detail"
import List from "./components/list/List"
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./lib/firebase";
import useUserStore from "./lib/userStore";
import useChatStore from "./lib/chatStore";

const App = () => {
  const {currentUser,isLoading, fetchUserInfo} = useUserStore();
  const {chatId,changeChat} = useChatStore();
  const {showDetails} = useChatStore();
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserInfo(user.uid);
      } else {
      fetchUserInfo(null); // Ensure isLoading is set to false if logged out
    }
    });
    return ()=>unsub();
    },[fetchUserInfo])
    // console.log(currentUser);
    if(isLoading) return <div className="loading">Loading...</div>;
    return (
    <div className='container'>
      { currentUser? (
      <>
      <List />
      {chatId && <Chat />}
      {showDetails && chatId && <Detail />}
      </>
      )
      :      (<Login/>)
      }
      <Notification/>
      
    </div>
  )
}

export default App
