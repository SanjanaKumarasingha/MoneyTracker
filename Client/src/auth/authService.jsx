// authService.js
export const login = async (email, password) => {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Login failed");
    return data;
  } catch (error) {
    throw error;
  }
};

export const signup = async (email, password) => {
  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Signup failed");
    return data;
  } catch (error) {
    throw error;
  }
};
