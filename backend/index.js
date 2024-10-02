import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import ImageKit from "imagekit";
import mongoose from "mongoose";
import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'

const port = process.env.PORT || 3000;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
)

app.use(express.json());

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO)
        console.log('Connected go MongoDB')
    } catch (err) {
        console.log(err)
    }
}

const imagekit = new ImageKit({
    urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
    publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY
});

app.get("/api/upload", (req, res) => {
    const result = imagekit.getAuthenticationParameters();
    res.send(result);
})

app.post("/api/chats", ClerkExpressRequireAuth(), async (req, res) => {
    const userId = req.auth.userId;
    const { text, model } = req.body;

    if (!model) {
        return res.status(400).json({ error: 'Model is required' });
    }

    try {
        // CREATE A NEW CHAT
        const newChat = new Chat({
            userId: userId,
            history: [{ role: 'user', parts: [{ text }] }],
            model: model
        });

        const savedChat = await newChat.save();

        // CHECK IF THE USERCHATS EXISTS
        const userChats = await UserChats.find({ userId: userId })

        // IF DOESN'T EXIST CREATE A NEW ONE AND ADD THE CHAT IN THE CHATS ARRAY
        if (!userChats.length) {
            const newUserChats = new UserChats({
                userId: userId,
                chats: [
                    {
                        _id: savedChat._id,
                        title: text.substring(0, 40),
                    },
                ],
            });

            await newUserChats.save();
        } else {
            // IF EXISTS, PUSH THE CHAT TO THE EXISTING ARRAY
            await UserChats.updateOne({ userId: userId }, {
                $push: {
                    chats: {
                        _id: savedChat._id,
                        title: text.substring(0, 40),
                    }
                }
            })
            res.status(201).json({ id: savedChat._id });
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Error creating chat: ' + err.message });
    }
});

app.post("/api/custom-chats", ClerkExpressRequireAuth(), async (req, res) => {
    const userId = req.auth.userId;
    const { prompt, model } = req.body;

    console.log(`Received request to create custom chat with prompt: ${prompt}, model: ${model}`);

    try {
        if (!prompt || !model) {
            throw new Error('Both prompt and model are required');
        }

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

        const newChat = new Chat({
            userId,
            history: initialHistory,
            model,
        });

        const savedChat = await newChat.save();
        console.log('New chat saved:', savedChat);

        const userChats = await UserChats.findOneAndUpdate(
            { userId },
            { $push: { chats: { _id: savedChat._id, title: prompt.substring(0, 40) } } },
            { new: true, upsert: true }
        );

        console.log('User chats updated: ', userChats);
        res.status(201).json({ id: savedChat._id });
    } catch (err) {
        console.error('Error creating custom chat:', err);
        res.status(500).json({ error: 'Error creating custom chat: ' + err.message });
    }
});

app.get('/api/userchats', ClerkExpressRequireAuth(), async (req, res) => {
    const userId = req.auth.userId;

    try {
        const userChats = await UserChats.find({ userId });
        res.status(200).send(userChats[0].chats);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching userchats!')
    }
});

app.get('/api/chats/:id', ClerkExpressRequireAuth(), async (req, res) => {
    const userId = req.auth.userId;

    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId });
        res.status(200).send(chat);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error creating chat!')
    }
});

app.put("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
    const userId = req.auth.userId;

    const { question, answer, img } = req.body;

    const newItems = [
        ...(question
            ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }]
            : []),
        { role: "model", parts: [{ text: answer }] },
    ];

    try {
        const updatedChat = await Chat.updateOne(
            { _id: req.params.id, userId },
            {
                $push: {
                    history: {
                        $each: newItems,
                    },
                },
            }
        );
        res.status(200).send(updatedChat);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error adding conversation!");
    }
});

app.delete('/api/chats/:id', ClerkExpressRequireAuth(), async (req, res) => {
    const userId = req.auth.userId;

    try {
        const chatId = req.params.id;

        // Delete the chat from the Chat collection
        await Chat.deleteOne({ _id: chatId, userId });

        // Remove the chat reference from the UserChats collection
        await UserChats.updateOne({ userId: userId }, {
            $pull: {
                chats: { _id: chatId }
            }
        });

        res.status(200).send('Chat deleted successfully!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Error deleting chat!');
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(401).send('Unauthenticated!')
});

app.use(express.static(path.join(__dirname, '../client')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.listen(port, () => {
    connect()
    console.log(`Server running on ${port}`);
});