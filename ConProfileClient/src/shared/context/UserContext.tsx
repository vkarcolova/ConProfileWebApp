import React, { createContext, useState, useEffect, ReactNode } from "react";

interface User {
  token: string;
  email: string;
  role: string;
}

interface UserContextProps {
  user: User | null | undefined;
  loginUser: (token: string, email: string, role: string) => void;
  logoutUser: () => void;
}

export const UserContext = createContext<UserContextProps | undefined>(
  undefined
);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined); // Začína ako undefined (nevieme stav)

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("useremail");
    const role = localStorage.getItem("role");

    if (token && email && role) {
      setUser({ token, email, role }); // Používateľ je prihlásený
    } else {
      setUser(null); // Používateľ nie je prihlásený
    }
  }, []);

  const loginUser = (token: string, email: string, role: string) => {
    setUser({ token, email, role });
    localStorage.setItem("token", token);
    localStorage.setItem("useremail", email);
    localStorage.setItem("role", role);
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("useremail");
    localStorage.removeItem("token");
  };

  return (
    <UserContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
};
