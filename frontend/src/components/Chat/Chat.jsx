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


    const sampleSchema = {
        tableName: "students",
        columns: [
            { name: "id_no", type: "number" },
            { name: "name", type: "string" },
            { name: "dob", type: "date" },
            { name: "course", type: "string" },
            { name: "graduating_year", type: "number" },
            { name: "starting_year", type: "number" },
        ]
    };

    // when new msg comes, it should scroll automatically
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory]);

    const generateBotResponse = (history) => {
        return {
            role: "model",
            text: "Here's the proposed schema:",
            schema: sampleSchema,
            onConfirm: () => {
                setChatHistory(prev => [
                    ...prev,
                    { role: "model", text: "Database created" }
                ]);
                setDbCreated(true);
            }
        };
    };

    const sendUserMessage = (message) => {
        setChatHistory(prev => [...prev, { role: "user", text: message }]);

        setTimeout(() => {
            const botMsg = generateBotResponse();
            setChatHistory(prev => [...prev, botMsg]);
        }, 600);
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
