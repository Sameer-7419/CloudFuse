import {Router} from 'express';
import LinkedAccount from '../db/LinkedAccount.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import axios from 'axios';

const router = Router();

router.use(authenticateToken);

router.get("/", async (req, res) => {
    try {
        const linkedAccounts = await LinkedAccount.find({ userId: req.user._id });
        if (!linkedAccounts || linkedAccounts.length === 0) {
            return res.status(404).json({ message: "No linked accounts found" });
        }
        const platforms = linkedAccounts.map(account => ({
            provider: account.provider,
            linkedAt: account.createdAt,
            scopes: account.scopes
        }));
        res.status(200).json({ linkedAccounts: platforms });
    } catch (error) {
        console.error("Error fetching linked accounts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/link", async (req, res) => {
    try {
        const { provider } = req.body;
        
        // Validate provider
        const supportedProviders = ['google_drive', 'dropbox'];
        if (!provider || !supportedProviders.includes(provider)) {
            return res.status(400).json({ 
                message: "Invalid provider. Supported providers: google_drive, dropbox, onedrive" 
            });
        }

        // Check if account is already linked
        const existingAccount = await LinkedAccount.findOne({ 
            userId: req.user._id, 
            provider 
        });
        
        if (existingAccount) {
            return res.status(409).json({ 
                message: `${provider} account is already linked` 
            });
        }

        // Create state parameter with user info
        const state = {
            userId: req.user._id,
            provider: provider,
            timestamp: Date.now()
        };
        
        const encodedState = encodeURIComponent(JSON.stringify(state));
        
        // Generate OAuth URLs based on provider
        let authUrl;
        
        switch (provider) {
            case 'google_drive':
                authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
                    `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}&` +
                    `response_type=code&` +
                    `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}&` +
                    `state=${encodedState}&` +
                    `access_type=offline&` +
                    `prompt=consent`;
                break;
                
            case 'dropbox':
                authUrl = `https://www.dropbox.com/oauth2/authorize?` +
                    `client_id=${process.env.DROPBOX_CLIENT_ID}&` +
                    `redirect_uri=${encodeURIComponent(process.env.DROPBOX_REDIRECT_URI)}&` +
                    `response_type=code&` +
                    `scope=${encodeURIComponent('files.content.write files.content.read sharing.write')}&` +
                    `token_access_type=offline&` +
                    `force_reapprove=true&` +
                    `state=${encodedState}`;
                break;
            default:
                return res.status(400).json({ message: "Unsupported provider" });
        }
        
        res.status(200).json({ 
            authUrl: authUrl,
            message: `Redirect user to this URL to authorize ${provider} access`
        });
        
    } catch (error) {
        console.error("Error generating OAuth URL:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete("/unlink", async (req, res) => {
    try {
        const { provider } = req.body;

        // Validate provider
        const supportedProviders = ['google_drive', 'dropbox'];
        if (!provider || !supportedProviders.includes(provider)) {
            return res.status(400).json({ 
                message: "Invalid provider. Supported providers: google_drive, dropbox" 
            });
        }

        // Find and delete linked account
        const result = await LinkedAccount.findOneAndDelete({ 
            userId: req.user._id, 
            provider 
        });

        if (!result) {
            return res.status(404).json({ 
                message: `${provider} account is not linked` 
            });
        }

        res.status(200).json({ 
            message: `${provider} account unlinked successfully` 
        });
    } catch (error) {
        console.error("Error unlinking account:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
);

router.post("/refresh",async (req, res) => {
    try {
        const { provider } = req.body;

        // Validate provider
        const supportedProviders = ['google_drive', 'dropbox'];
        if (!provider || !supportedProviders.includes(provider)) {
            return res.status(400).json({ 
                message: "Invalid provider. Supported providers: google_drive, dropbox" 
            });
        }

        // Find linked account
        const linkedAccount = await LinkedAccount.findOne({ 
            userId: req.user._id, 
            provider 
        });

        if (!linkedAccount) {
            return res.status(404).json({ 
                message: `${provider} account is not linked` 
            });
        }

        // Refresh token logic (example for Google Drive)
        let tokenResponse;
        if (provider === 'google_drive') {
            tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                refresh_token: linkedAccount.refreshToken,
                grant_type: 'refresh_token',
            });
        } else if (provider === 'dropbox') {
            tokenResponse = await axios.post('https://api.dropboxapi.com/oauth2/token', 
                new URLSearchParams({
                    client_id: process.env.DROPBOX_CLIENT_ID,
                    client_secret: process.env.DROPBOX_CLIENT_SECRET,
                    refresh_token: linkedAccount.refreshToken,
                    grant_type: 'refresh_token',
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
        } else {
            return res.status(400).json({ message: "Unsupported provider" });
        }

        const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

        // Update linked account with new tokens
        linkedAccount.accessToken = access_token;
        linkedAccount.refreshToken = refresh_token || linkedAccount.refreshToken; // Use existing refresh token if not provided
        linkedAccount.tokenExpiry = new Date(Date.now() + expires_in * 1000);
        linkedAccount.scopes = scope.split(' ');

        await linkedAccount.save();

        res.status(200).json({ 
            message: `${provider} account refreshed successfully`, 
            accessToken: access_token 
        });
    } catch (error) {
        console.error("Error refreshing token:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
);


export default router;

