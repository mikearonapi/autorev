import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import styles from './Layout.module.css';

export default function Layout() {
  const location = useLocation();

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main} key={location.pathname}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

