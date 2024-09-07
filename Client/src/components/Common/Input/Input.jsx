// src/components/common/Input.js
import React from "react";
import PropTypes from "prop-types";
import "./Input.css";

const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  ...rest
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`input ${className}`}
      {...rest}
    />
  );
};

Input.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};


export default Input;
