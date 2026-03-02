import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "text-2xl" }) => {
  return (
    <div className={`logo-text ${className}`}>
      <span className="logo-serv">Serv</span>
      <span className="logo-o">o</span>
      <span className="logo-x">X</span>
    </div>
  );
};

export default Logo;
