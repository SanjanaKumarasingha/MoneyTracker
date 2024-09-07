// src/components/common/Button.js
import './Button.css'; // Import button styles (optional)
import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ label, onClick, type = 'button', className = '', disabled = false }) => (
  <button 
    type={type} 
    className={`btn ${className}`} 
    onClick={onClick} 
    disabled={disabled}
  >
    {label}
  </button>
);

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Button;

