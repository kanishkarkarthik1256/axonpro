import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

const USERS_KEY = 'crossborder_users';
const TOKEN_KEY = 'crossborder_token';
const CURRENT_USER_KEY = 'crossborder_current_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const getUsers = () => {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  };

  const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const generateToken = () => {
    return 'token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
  };

  const initializeUserData = (userId) => {
    // Initialize crypto wallet
    const walletKey = `wallet_${userId}`;
    if (!localStorage.getItem(walletKey)) {
      localStorage.setItem(walletKey, JSON.stringify({
        BTC: 0.5,
        ETH: 2.5,
        USDT: 1000
      }));
    }

    // Initialize fiat balance
    const balanceKey = `balance_${userId}`;
    if (!localStorage.getItem(balanceKey)) {
      localStorage.setItem(balanceKey, JSON.stringify({
        USD: 10000,
        EUR: 5000,
        GBP: 3000,
        JPY: 500000,
        INR: 200000
      }));
    }

    // Initialize transactions
    const txKey = `transactions_${userId}`;
    if (!localStorage.getItem(txKey)) {
      localStorage.setItem(txKey, JSON.stringify([]));
    }
  };

  const register = (email, password, name) => {
    const users = getUsers();
    
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already exists' };
    }

    const newUser = {
      id: 'user_' + Date.now(),
      email,
      password,
      name,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    initializeUserData(newUser.id);

    return { success: true };
  };

  const login = (email, password) => {
    const users = getUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (!foundUser) {
      return { success: false, error: 'Invalid email or password' };
    }

    const token = generateToken();
    const userWithoutPassword = { ...foundUser };
    delete userWithoutPassword.password;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    
    setUser(userWithoutPassword);
    setIsAuthenticated(true);
    initializeUserData(foundUser.id);

    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex === -1) return { success: false, error: 'User not found' };

    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);

    const updatedUser = { ...user, ...updates };
    delete updatedUser.password;
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);

    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      register,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
