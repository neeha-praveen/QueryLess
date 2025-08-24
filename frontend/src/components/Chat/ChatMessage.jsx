import React from 'react'
import './Chat.css'

const ChatMessage = ({chat}) => {
    return (
        <div className={`msg ${chat.role==='model'?'bot':'user'}-msg`}>
            {chat.role==='model'}
            <p className="message-text">
                {chat.text}
            </p>
        </div>
    )
}

export default ChatMessage