import React from 'react';

export default function GreekRefuges() {
  React.useEffect(() => {
    // Redirect to the static HTML file
    window.location.href = '/greekrefuges.html';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
        <p className="text-stone-600">Φόρτωση Ορειβατικών Καταφυγίων...</p>
      </div>
    </div>
  );
}