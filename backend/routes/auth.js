import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../db/User.js";
import axios from "axios";
import LinkedAccount from "../db/LinkedAccount.js";

const JWT_SECRET = process.env.JWT_SECRET;
const router = Router();

router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create a new user
        const newUser = new User({
            username,
            password: hashedPassword,
            authProvider: "local", // Default to local authentication
        }); 
        await newUser.save();
        // Generate JWT token
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: "1h" });
        res.status(201).json({ token, user: { id: newUser._id, username: newUser.username } });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
);

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        // Check the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ token, user: { id: user._id, username: user.username } });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }   
}
);

router.post("/logout", (req, res) => {
    // Invalidate the token on the client side
    // This is a placeholder as JWTs are stateless and cannot be invalidated server-side
    res.status(200).json({ message: "Logged out successfully" });
}
);


router.get("/oauth/callback",async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    // Decode state — example: { provider: 'google', jwt: '...' }
    const parsedState = JSON.parse(decodeURIComponent(state));
    const { provider, userId } = parsedState;

    if (!provider || !userId) {
      return res.status(400).json({ error: 'Invalid state' });
    }

    // Exchange code for access token
    let tokenResponse;
    if (provider === 'google_drive') {
      tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      });
    }else if (provider === 'dropbox') {
        console.log('Making Dropbox token request...');
        console.log('Using client_id:', process.env.DROPBOX_CLIENT_ID);
        console.log('Using redirect_uri:', process.env.DROPBOX_REDIRECT_URI);
        
        // Dropbox requires form-encoded data, not JSON
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('grant_type', 'authorization_code');
        params.append('client_id', process.env.DROPBOX_CLIENT_ID);
        params.append('client_secret', process.env.DROPBOX_CLIENT_SECRET);
        params.append('redirect_uri', process.env.DROPBOX_REDIRECT_URI);

        tokenResponse = await axios.post('https://api.dropboxapi.com/oauth2/token', params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
    }else{
      return res.status(400).json({ error: 'Unsupported provider' });
    }
    
    console.log('Token exchange successful');
    const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

    // Save or update token in DB
    await LinkedAccount.findOneAndUpdate(
      { userId, provider },
      {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry: new Date(Date.now() + expires_in * 1000),
        scopes: scope?.split(' ') || [],
      },
      { upsert: true, new: true }
    );

    // Determine the frontend URL
    const frontendUrl = process.env.CLIENT_URL;
    
    return res.redirect(`${frontendUrl}/dashboard?linked=${provider}`);
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    return res.status(500).json({ error: 'OAuth callback failed' });
  }
}
);







export default router;