import { arrayUnion, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import './addUser.css';
import { db } from '../../../../lib/firebase'; 
import {query,where} from "firebase/firestore";
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useUserStore } from '../../../../lib/userStore';
const AddUser = () => {
    const {currentUser} = useUserStore();
    const [user, setUser] = useState(null);


    const handleSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get("username");
        try {
            const userRef = collection(db, "users");
            const querySnapShot = await getDocs(userRef);
            // Find user with case-insensitive match
            const found = querySnapShot.docs.find(docSnap =>
                docSnap.data().username.toLowerCase() === username.toLowerCase()
            );
            if (found) {
                setUser({ id: found.id, ...found.data() });
            } else {
                setUser(null);
                toast.error("User not found.");
            }
        } catch (error) {
            console.log(error.message);
            toast.error(error.message);
        }
    };
        const handleAdd = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error("No user selected to add.");
            return;
        }
        if (user.id === currentUser.id) {
            alert("You cannot add yourself to the chat.");
            return;
        }

        // 1. Fetch current user's chat list
        const userChatsRef = doc(db, "userchats", currentUser.id);
        const userChatsSnap = await getDoc(userChatsRef);
        const chats = userChatsSnap.exists() ? userChatsSnap.data().chats : [];

        // 2. Check if a chat with this user already exists
        const alreadyExists = chats.some(
            chat => chat.receiverId === user.id
        );
        if (alreadyExists) {
            toast.info("User is already in your chat list.");
            return;
        }

        const chatRef = collection(db, "chats");
        try {
            const newChatRef = doc(chatRef);
            await setDoc(newChatRef, {
                createdAt: serverTimestamp(),
                message: [],
            });

            // Ensure userchats docs exist
            await setDoc(doc(db, "userchats", user.id), { chats: [] }, { merge: true });
            await setDoc(doc(db, "userchats", currentUser.id), { chats: [] }, { merge: true });

            // Now use updateDoc with arrayUnion
            await updateDoc(doc(db, "userchats", user.id), {
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: "",
                    receiverId: currentUser.id,
                    updatedAt: Date.now(),
                })
            });
            await updateDoc(doc(db, "userchats", currentUser.id), {
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: "",
                    receiverId: user.id,
                    updatedAt: Date.now(),
                })
            });

            toast.success("User added to chat!");
            // Optionally, clear the search/user state here
            setUser(null);

        } catch (error) {
            toast.error(error.message);
        }
    };


  return (
    <div className=''>
        <div className="addUser">
            <form onSubmit={handleSearch}>
                <input type="text" placeholder="Username" name="username" />
                <button>Search</button>
            </form>
            {user && 
            <div className="user">
                <div className="detail">
                    <img src={user.avatar || "./avatar.png" }alt="" />
                    <span>{user.username}</span>

                </div>
                <button onClick={handleAdd}>Add User</button>
            </div>}
        </div>
    </div>
  )
}

export default AddUser