"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const login = async (e:any) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      alert(error.message);
      return;
    }

    window.location.href="/dashboard";
  };

  return (
    <div style={{padding:40}}>

      <h2>Confluxa Login</h2>

      <form onSubmit={login}>

        <input
          placeholder="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <br/><br/>

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <br/><br/>

        <button type="submit">
          Login
        </button>

      </form>

    </div>
  );
}