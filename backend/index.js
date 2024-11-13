import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import ImageKit from "imagekit";
import mongoose from "mongoose";
import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";

const port = process.env.PORT || 3000;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);
app.use(express.json());

// MongoDB connection
const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.log(err);
    }
};

const imagekit = new ImageKit({
    urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
    publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

// Mock user ID (for development/testing purposes)
const mockUserId = "mock-user-id";

// API Routes
app.get("/api/upload", (req, res) => {
    const result = imagekit.getAuthenticationParameters();
    res.send(result);
});

app.post("/api/chats", async (req, res) => {
    const userId = mockUserId; // Use mockUserId
    const { text, model } = req.body;

    if (!model) {
        return res.status(400).json({ error: 'Model is required' });
    }

    try {
        const newChat = new Chat({
            userId,
            history: [{ role: 'user', parts: [{ text }] }],
            model
        });
        const savedChat = await newChat.save();
        const userChats = await UserChats.find({ userId });

        if (!userChats.length) {
            const newUserChats = new UserChats({
                userId,
                chats: [{ _id: savedChat._id, title: text.substring(0, 40) }],
            });

            await newUserChats.save();
        } else {
            await UserChats.updateOne(
                { userId },
                { $push: { chats: { _id: savedChat._id, title: text.substring(0, 40) } } }
            );
        }

        res.status(201).json({ id: savedChat._id });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error creating chat: ' + err.message });
    }
});

app.post("/api/custom-chats", async (req, res) => {
    const userId = mockUserId; // Use mockUserId
    const { prompt, model } = req.body;

    console.log(`Received request to create custom chat with prompt: ${prompt}, model: ${model}`);
    try {
        if (!prompt || !model) throw new Error('Both prompt and model are required');

        let initialHistory;
        if (model === 'gpt-4o') {
            initialHistory = [{ role: 'system', parts: [{ text: prompt }] }];
        } else if (model === 'gemini-flash-1.5') {
            initialHistory = [
                { role: 'user', parts: [{ text: prompt }] },
                { role: 'model', parts: [{ text: 'I understand.' }] }
            ];
        } else {
            throw new Error('Unsupported model');
        }

        const newChat = new Chat({ userId, history: initialHistory, model, isCustomChatbot: true });

        const savedChat = await newChat.save();
        await UserChats.findOneAndUpdate(
            { userId },
            { $push: { chats: { _id: savedChat._id, title: prompt.substring(0, 40) } } },
            { new: true, upsert: true }
        );

        res.status(201).json({ id: savedChat._id });
    } catch (err) {
        console.error('Error creating custom chat:', err);
        res.status(500).json({ error: 'Error creating custom chat: ' + err.message });
    }
});

app.get('/api/userchats', async (req, res) => {
    const userId = mockUserId; // Use mockUserId
    try {
        const userChats = await UserChats.find({ userId });
        res.status(200).send(userChats[0]?.chats || []);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching userchats!');
    }
});

app.get('/api/chats/:id', async (req, res) => {
    const userId = mockUserId; // Use mockUserId
    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId });
        if (chat) {
            res.status(200).json(chat);
        } else {
            res.status(404).json({ error: 'Chat not found' });
        }
    } catch (err) {
        console.error('Error fetching chat:', err);
        res.status(500).json({ error: 'Error fetching chat: ' + err.message });
    }
});

app.put("/api/chats/:id", async (req, res) => {
    const userId = mockUserId; // Use mockUserId
    const { question, answer, img } = req.body;
    const newItems = [
        ...(question ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }] : []),
        { role: "model", parts: [{ text: answer }] },
    ];

    try {
        const updatedChat = await Chat.updateOne(
            { _id: req.params.id, userId },
            { $push: { history: { $each: newItems } } }
        );
        res.status(200).send(updatedChat);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error adding conversation!");
    }
});

app.delete('/api/chats/:id', async (req, res) => {
    const userId = mockUserId; // Use mockUserId
    try {
        const chatId = req.params.id;
        await Chat.deleteOne({ _id: chatId, userId });
        await UserChats.updateOne(
            { userId },
            { $pull: { chats: { _id: chatId } } }
        );
        res.status(200).send('Chat deleted successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Error deleting chat!');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('An error occurred!');
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// Start the server
app.listen(port, () => {
    connect();
    console.log(`Server running on ${port}`);
});
