import './Chat.css'
import React, { useRef, useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import ChatMessage from './ChatMessage';
import Header from '../Header/Header'
import SchemaPreview from '../SchemaPreview/SchemaPreview';

const Chat = () => {
    const [hasPrompts, setHasPrompts] = useState(false);
    const [firstPrompt, setFirstPrompt] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef();
    const [chatHistory, setChatHistory] = useState([]);
    const chatEndRef = useRef(null);
    const [dbCreated, setDbCreated] = useState(false);

    // when new msg comes, it should scroll automatically
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory]);

    const generateBotResponse = async (userMessage) => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:4000/api/schema/propose", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ prompt: userMessage })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Schema proposal failed");

            // backend returns { schemaDef, textSummary }
            return {
                role: "model",
                text: data.textSummary,
                schema: data.schemaDef,
                onConfirm: async () => {
                    try {
                        const createRes = await fetch("http://localhost:4000/api/workspace/create", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                name: data.schemaDef.tables[0]?.name || "newdb",
                                schemaDef: data.schemaDef,
                            }),
                        });

                        const createData = await createRes.json();
                        if (!createRes.ok) throw new Error(createData.error || "Failed to create DB");

                        setChatHistory(prev => [
                            ...prev,
                            { role: "model", text: `✅ Database created! Schema: ${createData.schemaName}` }
                        ]);
                        setDbCreated(true);
                    } catch (err) {
                        setChatHistory(prev => [
                            ...prev,
                            { role: "model", text: `❌ Error: ${err.message}` }
                        ]);
                    }
                }
            };
        } catch (err) {
            return {
                role: "model",
                text: `❌ Error: ${err.message}`,
            };
        }
    };

    const sendUserMessage = async (message) => {
        setChatHistory(prev => [...prev, { role: "user", text: message }]);
        const botMsg = await generateBotResponse(message);
        setChatHistory(prev => [...prev, botMsg]);
    };


    const handleGenerate = () => {
        if (!firstPrompt) {
            setFirstPrompt(inputValue);
            sendUserMessage(inputValue);
        }
        setHasPrompts(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const userMessage = inputRef.current.value.trim();
        if (!userMessage) {
            return;
        }
        inputRef.current.value = ""
        sendUserMessage(userMessage);
    }

    return (
        <div className='chat'>
            <Header dbCreated={dbCreated} onWorkWithDb={() => alert("Open DB editor")} />

            {hasPrompts === false ? (
                <div className="chat-body">
                    <div className="empty-chat">
                        <h2>Create New</h2>
                        <div className="input-wrap">
                            <textarea
                                placeholder='Describe the table you need... '
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                        </div>
                        <button onClick={handleGenerate}>Generate Database</button>
                    </div>
                </div>
            ) : (
                <div className='chat-body'>
                    <div className="actual-chat">
                        <div className="chat-started">
                            {chatHistory.map((chat, index) => (
                                <ChatMessage key={index} chat={chat} />
                            ))}
                            {/* dummy div to scroll to */}
                            <div ref={chatEndRef} />
                        </div>
                    </div>
                    <div className="chat-footer">
                        <form
                            action=""
                            className="chat-form"
                            onSubmit={handleFormSubmit}
                        >
                            <input
                                type="text"
                                placeholder='chat'
                                className="message-input"
                                required
                                ref={inputRef}
                            />
                            <button className='send-btn'><ArrowUp /></button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;