import "./messageMenu.css";
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faRefresh, faCogs } from '@fortawesome/free-solid-svg-icons';

const MessageMenu = ({ currentModel, onCopy, onChangeModel, onGenerateNew, showAll }) => {
  const [isModalVisible, setModalVisible] = useState(false);

  const handleModelChange = (model) => {
    onChangeModel(model); // Pass the selected model to the parent function
    setModalVisible(false); // Close the modal
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <div className="message-menu">
      {showAll ? (
        <>
          <button onClick={onCopy}>
            <FontAwesomeIcon icon={faCopy} />
            <div className="tooltip">Copy Message</div>
          </button>
          <button onClick={onGenerateNew}>
            <FontAwesomeIcon icon={faRefresh} />
            <div className="tooltip">Generate New Response</div>
          </button>
          {/* Button to trigger the modal */}
          <button onClick={toggleModal}>
            <FontAwesomeIcon icon={faCogs} />
            <div className="tooltip">Change Model (current: {currentModel})</div>
          </button>

          {/* Modal Pop-up for model selection */}
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
        </>
      ) : (
        <button onClick={onCopy}>
          <FontAwesomeIcon icon={faCopy} />
          <div className="tooltip">Copy Message</div>
        </button>
      )}
    </div>
  );
};

export default MessageMenu;
