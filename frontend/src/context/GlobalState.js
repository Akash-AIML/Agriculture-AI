import React, { createContext, useState } from 'react';

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const [analysisResults, setAnalysisResults] = useState({
        disease: null,
        soil: null,
        crop: null,
    });

    const updateResult = (type, data) => {
        setAnalysisResults(prev => ({ ...prev, [type]: data }));
    };

    return (
        <GlobalContext.Provider value={{ analysisResults, updateResult }}>
            {children}
        </GlobalContext.Provider>
    );
};
