import "./messageMenu.css";
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faRefresh, faCogs } from '@fortawesome/free-solid-svg-icons';

const MessageMenu = ({ onCopy, onChangeModel, onGenerateNew, showAll }) => {
  return (
    <div className="message-menu">
      {showAll ? (
        <>
          <button onClick={onCopy} title="Copy Message">
            <FontAwesomeIcon icon={faCopy} />
            <div className="tooltip">Copy Message</div>
          </button>
          <button onClick={onGenerateNew} title="Generate New">
            <FontAwesomeIcon icon={faRefresh} />
            <div className="tooltip">Generate New</div>
          </button>
          <button onClick={onChangeModel} title="Change Model">
            <FontAwesomeIcon icon={faCogs} />
            <div className="tooltip">Change Model</div>
          </button>
        </>
      ) : (
        <button onClick={onCopy} title="Copy Message">
          <FontAwesomeIcon icon={faCopy} />
          <div className="tooltip">Copy Message</div>
        </button>
      )}
    </div>
  );
};

export default MessageMenu;
