
import React, { createContext, useState, useEffect, ReactNode } from "react";

interface User {
  token: string;
  email: string;
}

interface UserContextProps {
  user: User | null;
  loginUser: (token: string, email: string) => void;
  logoutUser: () => void;
}

export const UserContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("useremail");
    if (token && email) {
      setUser({ token, email });
    }
  }, []);

  const loginUser = (token: string, email: string) => {
    setUser({ token, email });
    localStorage.setItem("token", token);
    localStorage.setItem("useremail", email);
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("useremail");
  };

  return (
    <UserContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
};