import React from 'react';
import './Layout.css';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => (
  <div className="app-shell">
    <div className="app-shell__gradient" aria-hidden="true" />
    <div className="app-shell__pattern" aria-hidden="true" />
    <Header />
    <main className="app-main">
      <div className="app-container">
        {children}
      </div>
    </main>
    <Footer />
  </div>
);

export default Layout;
