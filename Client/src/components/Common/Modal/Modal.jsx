// src/components/common/Modal.js
import * as React from "react";
import PropTypes from "prop-types";
import "./Modal.css";

const MyModal = () => {
  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) {
      return null;
    }

    return (
      <div className="modal-overlay">
        <div className="modal">
          <button className="close-btn" onClick={onClose}>
            X
          </button>
          {children}
        </div>
      </div>
    );
  };

  return Modal();
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default Modal;
