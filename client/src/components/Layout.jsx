import React from 'react';
import './Layout.css';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <main>
        <div className="main-content-container">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
