import mongoose from "mongoose";


const fileSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedTo: [
      {
        provider: {
          type: String,
          enum: ['google_drive', 'dropbox', 'onedrive'],
          required: true
        },
        fileId: String,
        path:String,
        status: {
          type: String,
          enum: ['success', 'failed', 'pending'],
          default: 'pending'
        },
        link: String,
        timestamp: Date
      }
    ],
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  });

const File = mongoose.model('File', fileSchema);

export default File;
  