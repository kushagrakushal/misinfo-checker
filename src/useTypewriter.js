import { useState, useEffect } from 'react';

// This custom hook creates the typewriter effect for the bot's messages.
const useTypewriter = (text, speed = 20) => {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        setDisplayText(''); // Reset text when the source text changes
        if (!text) return;

        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                setDisplayText(prevText => prevText + text.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, speed);

        return () => {
            clearInterval(typingInterval);
        };
    }, [text, speed]);

    return displayText;
};

export default useTypewriter;
