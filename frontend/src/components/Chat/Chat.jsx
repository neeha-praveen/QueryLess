import './Chat.css'
import React, { useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import ChatMessage from './ChatMessage';

const Chat = () => {
    const [hasPrompts, setHasPrompts] = useState(false);
    const [firstPrompt, setFirstPrompt] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef();
    const [chatHistory, setChatHistory] = useState([]);

    const generateBotResponse = (history) => {
        console.log(history);
    }

    const handleGenerate = () => {
        if (!firstPrompt) {
            setFirstPrompt(inputValue);
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

        // update chat history with new user message
        setChatHistory(history => [...history, { role: "user", text: userMessage }]);

        // bot message
        setTimeout(() => {
            setChatHistory((history) => [...history, { role: "model", text: "working on it ..." }]);
            // call the function to generate the response
            generateBotResponse([...chatHistory, { role: "user", text: userMessage }]);
        }, 600);
    }

    return (
        <div className='chat'>
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
                            <div className="msg user-msg first-prompt">
                                <p className="message-text">
                                    {firstPrompt}
                                </p>
                            </div>
                            {chatHistory.map((chat, index) => (
                                <ChatMessage key={index} chat={chat} />
                            ))}
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
