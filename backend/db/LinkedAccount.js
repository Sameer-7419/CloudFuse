import mongoose from "mongoose";

const linkedAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['google_drive', 'dropbox', 'onedrive'],
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiry: {
    type: Date,
    required: true
  },
  scopes: [String],
}, { timestamps: true });

const LinkedAccount= mongoose.model('LinkedAccount', linkedAccountSchema);

export default LinkedAccount;
