import { useState } from "react"
import { toast } from "react-toastify";
import "./login.css"
import { createUserWithEmailAndPassword} from "firebase/auth";
import { signInWithEmailAndPassword} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import upload from "../../lib/uplode";
// import SplitText from "../../lib/splittext";



const Login = () => {
    const [avatar,setAvatar] = useState({
        file:null,
        url:""
    });
    const [loading,setLoading] = useState(false);
    const handleAvatar = e => {
        if (e.target.files && e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    }
    const handleRegister =async (e) =>{
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.target);
        const {username, email, password} = Object.fromEntries(formData);
        try {
            const res =  await createUserWithEmailAndPassword(auth,email,password)
            let imgURL = "./avatar.png";
            if (avatar.file) {
              imgURL = await upload(avatar.file);
            }
            await setDoc(doc(db, "users", res.user.uid), {
              username,
              email,
              avatar: imgURL,
              id: res.user.uid,
              blocked: []
            });
            await setDoc(doc(db, "userchats", res.user.uid),{
                chats:[],
            });
        toast.success("Account Created!,Sign In to Continue");
        setTimeout(() => {
        window.location.reload();
        }, 1500);

            
        } catch (err) {
            console.log(err)
            toast.error(err.message)
            
        }finally{
            setLoading(false);
        }
    }
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true)
        const formData = new FormData(e.target);
        const {email, password} = Object.fromEntries(formData);
        try {
            await signInWithEmailAndPassword(auth,email,password)

            
        } catch (error) {
            console.log(error)
            toast.error(error.message)
            
        }finally{
            setLoading(false)
        }
    }
    // const handleAnimationComplete = () => {
    // console.log('All letters have animated!');
    // };
    
    
  return (
    <div className='login'>
        <div className="item">
            {/* <SplitText
            text="Welcome, Back!"
            className="text-2xl font-semibold text-center"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={handleAnimationComplete}
            /> */}
            <h1>Welcome, Back!</h1>
            <form onSubmit={handleLogin}>
                <input type="text" placeholder="Email" name="email"/>
                <input type="text" placeholder="Password" name="password"/>
                <button disabled={loading}>{loading? "loading":"Sign In"}</button>
            </form>
        </div>
        <div className="separator"></div>
        <div className="item">
            <h2>Create an Account,</h2>
            <form onSubmit={handleRegister}>
                <label htmlFor="file">
                <img src={avatar.url || "./avatar.png"} alt="" />Upload an Image</label>
                <input type="file" id="file" style={{display:"none"}} onChange={handleAvatar}/>
                <input type="text" placeholder="Username" name="username"/>
                <input type="text" placeholder="Email" name="email"/>
                <input type="text" placeholder="Password" name="password"/>
                <button disabled={loading}>{loading? "loading":"Sign Up"}</button>
            </form>
        </div>

    </div>
  )
}

export default Login