import React from 'react'
import './Chat.css'
import SchemaPreview from '../SchemaPreview/SchemaPreview'

const ChatMessage = ({ chat }) => {
    return (
        <div className={`msg ${chat.role === 'model' ? 'bot' : 'user'}-msg`}>
            <div className="message-text">
                <p>{chat.text}</p>
                {chat.schema && (
                    <SchemaPreview schema={chat.schema} onConfirm={chat.onConfirm} />
                )}
            </div>
        </div>
    )
}


export default ChatMessage