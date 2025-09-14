import { useState, useEffect } from 'react';

const useTypewriter = (text, speed = 25) => {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        // Reset text when the source text changes
        setDisplayText('');

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