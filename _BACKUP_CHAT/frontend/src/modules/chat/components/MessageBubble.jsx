import React from 'react';
import { BsCheck, BsCheckAll, BsClock } from 'react-icons/bs';

const MessageBubble = ({ message, isMe }) => {
    const { content, created_at, status, message_type } = message;

    // Time formatting
    const time = new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Status Icon
    const StatusIcon = () => {
        if (!isMe) return null;
        if (status === 'sending') return <BsClock className="w-3 h-3 text-white/70" />;
        if (status === 'sent') return <BsCheck className="w-4 h-4 text-white/70" />;
        if (status === 'delivered') return <BsCheckAll className="w-4 h-4 text-white/70" />;
        if (status === 'read') return <BsCheckAll className="w-4 h-4 text-blue-200" />;
        return null;
    };

    return (
        <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-4 group`}>
            <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                    className={`relative px-4 py-2 shadow-sm text-sm md:text-base break-words
                    ${isMe
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm'
                        }`}
                >
                    {/* Message Content */}
                    {message_type === 'text' && (
                        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
                    )}

                    {/* Metadata & Status */}
                    <div className={`flex items-center gap-1 text-[10px] mt-1 select-none
                        ${isMe ? 'justify-end text-blue-100' : 'justify-start text-gray-400'}
                    `}>
                        <span>{time}</span>
                        <StatusIcon />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
