import React, { createContext, useContext, useState } from 'react';

export const ModelContext = createContext();

export const ModelProvider = ({ children }) => {
  const [currentModel, setCurrentModel] = useState(import.meta.env.VITE_DEFAULT_LLM_MODEL);

  return (
    <ModelContext.Provider value={{ currentModel, setCurrentModel }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => useContext(ModelContext);