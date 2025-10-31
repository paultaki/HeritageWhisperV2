"use client";

import React, { useState } from "react";
import Page from "../book-old/components/Page";
import BookWrap from "../book-old/components/BookWrap";

export default function SimpleTestPage() {
  const [currentPage, setCurrentPage] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 bg-white border-b">
        <h1 className="text-2xl font-bold">Testing BookWrap + Pages</h1>
        <p className="text-sm text-gray-600">
          Use arrow keys or scroll to navigate
        </p>
      </div>

      <BookWrap
        currentPage={currentPage}
        totalPages={3}
        onPageChange={setCurrentPage}
      >
        <Page index={0} total={3}>
          <div className="book-text">
            <h2 className="book-heading">Page 1</h2>
            <p>
              This is the first page. Use arrow keys or scroll down to see more
              pages.
            </p>
          </div>
        </Page>

        <Page index={1} total={3}>
          <div className="book-text">
            <h2 className="book-heading">Page 2</h2>
            <p>
              This is the second page. The pages should snap into view as you
              scroll.
            </p>
          </div>
        </Page>

        <Page index={2} total={3}>
          <div className="book-text">
            <h2 className="book-heading">Page 3</h2>
            <p>
              This is the third and final page. You should see arrow buttons and
              keyboard navigation should work.
            </p>
          </div>
        </Page>
      </BookWrap>
    </div>
  );
}
