import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase.js";
import Auth from "./Auth.jsx";
import App from "./App.jsx";
import Complete from "./Complete.jsx";

export default function Root() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setError("");
      if (!u) {
        setProfile(null);
        setChecking(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setProfile(snap.data());
      } catch (e) {
        setError("Could not load your profile. Check your internet and that the Firestore database is created.");
      }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="phone">
        <div className="soon">
          <div className="big">🎓</div>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  
  if (!user) {
    return <Auth onProfile={setProfile} notice={error} />;
  }

  if (!profile) {
    return <Complete uid={user.uid} onProfile={setProfile} onLogout={() => signOut(auth)} notice={error} />;
  }

  return <App key={user.uid} profile={profile} uid={user.uid} onLogout={() => signOut(auth)} />;
}