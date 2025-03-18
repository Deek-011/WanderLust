import { Link } from "react-router-dom"
import { useState } from "react";
import  axios from "axios";
export default function RegisterPage() {
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
   async function registerUser(ev){
    ev.preventDefault();
    try {
     await axios.post("/api/register", {
      name,
      email,
      password,
    });
    alert('Registration Successful. You can Login to Enjoy our Services');
  } catch (error) {
    alert('Registration Failed. Please try again');
  }
}
  return (
    <div className="mt-4 grow flex items-center justify-around">
      <div className="mb-16">
        <h1 className="text-4xl text-center mb-4">Register</h1>
        <form className="max-w-md mx-auto" onSubmit={registerUser}>
        <input type="text" 
                placeholder="your name" className="w-full border p-2 rounded-md" 
                value={name} 
                onChange={ev => setName(ev.target.value)} />
          <input type="email" 
                placeholder="your@email.com" className="w-full border p-2 rounded-md" 
                value={email} 
                onChange={ev => setEmail(ev.target.value)} />
          <input type="password" 
                placeholder="password" className="w-full border p-2 rounded-md" 
                value={password} 
                onChange={ev => setPassword(ev.target.value)} />
          <button className="login">Register</button>
          <div className="text-center py-2 text--500">
            Already a Member? <Link className="underline text-blue-400" to = {'/login'}>Login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
