import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-blue-600 text-white py-8 px-4">
      <div className="container mx-auto">
        {/* Top section with logo and navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          {/* Logo section */}
          <div className="mb-6 md:mb-0">
            <a href="/" className="flex items-center">
              <div className="w-8 h-8 mr-2">
                <svg viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 6C8 4.89543 8.89543 4 10 4H22C23.1046 4 24 4.89543 24 6V26L16 20L8 26V6Z" stroke="white" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <span className="text-xl font-semibold">myprintcorner.com</span>
            </a>
          </div>
          
          {/* Navigation links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
            <div className="space-y-3">
              <a href="/about" className="block hover:underline">About Us</a>
              <a href="/language" className="block hover:underline">Language Options</a>
              <a href="/how-it-works" className="block hover:underline">How it Works?</a>
            </div>
            <div className="space-y-3">
              <a href="/partner" className="block hover:underline">Become a Print Partner</a>
              <a href="/contact" className="block hover:underline">Contact Us</a>
              <a href="/privacy" className="block hover:underline">Privacy Policy</a>
            </div>
          </div>
        </div>
        
        {/* Divider line */}
        <div className="border-t border-blue-400 my-4"></div>
        
        {/* Copyright section */}
        <div className="text-center">
          <p>© 2024 myprintecorner.com.</p>
          <p>All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;