import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { auth } from '../firebase';

const AuthContext = createContext(null);

const db = getFirestore();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = userDoc.data();
        setUser({
          ...firebaseUser,
          username: userData?.username,
          isAdmin: userData?.isAdmin || false
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (username, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if this is the first user (to make them an admin)
    const usersCollection = await getDoc(doc(db, "users", "count"));
    const isFirstUser = !usersCollection.exists();

    // Store additional user info in Firestore
    await setDoc(doc(db, "users", user.uid), {
      username,
      email,
      isAdmin: isFirstUser
    });

    // Update user count
    await setDoc(doc(db, "users", "count"), { count: (usersCollection.data()?.count || 0) + 1 }, { merge: true });

    return user;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};