import './Chat.css';
import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import ChatMessage from './ChatMessage';
import Header from '../Header/Header';
import { useNavigate } from 'react-router-dom';

const Chat = ({ setActiveWorkspace, activeWorkspace }) => {
    const [hasPrompts, setHasPrompts] = useState(false);
    const [firstPrompt, setFirstPrompt] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [dbCreated, setDbCreated] = useState(false);
    const inputRef = useRef();
    const chatEndRef = useRef(null);
    const navigate = useNavigate();

    // auto-scroll to bottom
    useEffect(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    //  normal schema proposal
    const generateBotResponse = async (userMessage) => {
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:4000/api/schema/propose', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ prompt: userMessage }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Schema proposal failed');

            return {
                role: 'model',
                text: data.textSummary || "Here's the proposed schema:",
                schema: data.schemaDef,
                onConfirm: async () => {
                    try {
                        const createRes = await fetch('http://localhost:4000/api/workspace/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                name: data.schemaDef.tables?.[0]?.name || 'newdb',
                                schemaDef: data.schemaDef,
                            }),
                        });

                        const createData = await createRes.json();
                        if (!createRes.ok) throw new Error(createData.error || 'Failed to create DB');

                        setChatHistory((prev) => [
                            ...prev,
                            { role: 'model', text: `✅ Database created! Schema: ${createData.schemaName}` },
                        ]);

                        setDbCreated(true);
                        if (setActiveWorkspace)
                            setActiveWorkspace({
                                schema: createData.schemaName,
                                table: data.schemaDef.tables?.[0]?.name || 'table1',
                            });

                    } catch (err) {
                        setChatHistory((prev) => [...prev, { role: 'model', text: `❌ Error: ${err.message}` }]);
                    }
                },
            };
        } catch (err) {
            return { role: 'model', text: `❌ Error: ${err.message}` };
        }
    };

    //  handle DB queries (after creation)
    const handleAgentQuery = async (message) => {
        const token = localStorage.getItem("token");

        if (!activeWorkspace?.schema) {
            setChatHistory(prev => [...prev, {
                role: "model",
                text: "❌ No active workspace found. Please create a database first."
            }]);
            return;
        }

        try {
            const res = await fetch("http://localhost:4000/api/agent/run", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message,
                    schemaName: activeWorkspace.schema
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Agent query failed");
            }

            // Display reply
            setChatHistory(prev => [
                ...prev,
                {
                    role: "model",
                    text: data.answer || "Executed.",
                    sql: data.sql || data.originalSQL,
                    rows: data.rows || [],
                }
            ]);

        } catch (err) {
            setChatHistory(prev => [
                ...prev,
                { role: "model", text: `❌ Agent Error: ${err.message}` }
            ]);
        }
    };

    //  Decide what to do when user sends a message
    const sendUserMessage = async (message) => {
        setChatHistory((prev) => [...prev, { role: 'user', text: message }]);

        if (dbCreated) {
            await handleAgentQuery(message);
        } else {
            const botMsg = await generateBotResponse(message);
            setChatHistory(prev => [...prev, botMsg]);
        }

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
        if (!userMessage) return;
        inputRef.current.value = '';
        sendUserMessage(userMessage);
    };

    return (
        <div className="chat">
            <Header dbCreated={dbCreated} onWorkWithDb={() => navigate('/db')} />

            {!hasPrompts ? (
                <div className="chat-body">
                    <div className="empty-chat">
                        <h2>Create New</h2>
                        <div className="input-wrap">
                            <textarea
                                placeholder="Describe the table you need..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                        </div>
                        <button onClick={handleGenerate}>Generate Database</button>
                    </div>
                </div>
            ) : (
                <div className="chat-body">
                    <div className="actual-chat">
                        <div className="chat-started">
                            {chatHistory.map((chat, index) => (
                                <ChatMessage key={index} chat={chat} />
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    <div className="chat-footer">
                        <form className="chat-form" onSubmit={handleFormSubmit}>
                            <input
                                type="text"
                                placeholder="chat"
                                className="message-input"
                                required
                                ref={inputRef}
                            />
                            <button className="send-btn">
                                <ArrowUp />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
