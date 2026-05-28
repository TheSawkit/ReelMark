'use client';

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

export function useAutoResetError(
    duration = 3000
): [boolean, Dispatch<SetStateAction<boolean>>] {
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!error) return;
        const id = setTimeout(() => setError(false), duration);
        return () => clearTimeout(id);
    }, [error, duration]);

    return [error, setError];
}
