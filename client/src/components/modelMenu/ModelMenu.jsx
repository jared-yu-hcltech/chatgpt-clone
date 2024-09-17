import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs } from '@fortawesome/free-solid-svg-icons';
import './modelMenu.css';
import { useModel } from '../../context/ModelContext';

const ModelMenu = () => {
    const { currentModel, setCurrentModel } = useModel();
    const [isModalVisible, setModalVisible] = useState(false);

    const handleModelChange = (model) => {
        setCurrentModel(model);
        setModalVisible(false);
    };

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    return (
        <div className="model-menu">
            <button onClick={toggleModal}>
                <FontAwesomeIcon icon={faCogs} />
                <span>Change Model (current: {currentModel})</span>
            </button>

            {isModalVisible && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Select a Model</h3>
                        <p>Choose a model from the list below:</p>
                        <div className="model-options">
                            <div
                                className={`model-option ${currentModel === "gpt-4o" ? 'selected' : ''}`}
                                onClick={() => handleModelChange("gpt-4o")}
                            >
                                <h4>GPT-4o (Open AI)</h4>
                                <p>Optimized for complex tasks with enhanced language understanding.</p>
                            </div>
                            <div
                                className={`model-option ${currentModel === "gemini-flash-1.5" ? 'selected' : ''}`}
                                onClick={() => handleModelChange("gemini-flash-1.5")}
                            >
                                <h4>Gemini Flash 1.5 (Google)</h4>
                                <p>Ideal for real-time applications with fast responses.</p>
                            </div>
                            <div
                                className={`model-option ${currentModel === "Llama 3.2" ? 'selected' : ''}`}
                                onClick={() => handleModelChange("Llama 3.2")}
                            >
                                <h4>Llama 3.2 (Meta)</h4>
                                <p>Experimental model for research and lightweight tasks.</p>
                            </div>
                        </div>
                        <button onClick={() => setModalVisible(false)} className="close-modal">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModelMenu;