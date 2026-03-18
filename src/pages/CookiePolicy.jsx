import React, { useState } from 'react';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { useSEO } from '@/components/seo/useSEO';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CookiePolicy() {
  const { language } = useLanguage();
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  useSEO({
    title: language === 'el' ? 'Πολιτική Cookies | Nature Explorers' : 'Cookie Policy | Nature Explorers',
    description: language === 'el'
      ? 'Μάθετε πώς χρησιμοποιούμε cookies και πώς μπορείτε να διαχειριστείτε τις προτιμήσεις σας.'
      : 'Learn about the cookies we use and how to manage your cookie preferences.',
    url: 'https://natureexplorers.gr/CookiePolicy',
  });

  const handleOpenPreferences = () => {
    // Trigger the cookie settings button click to open preferences modal
    const settingsButton = document.querySelector('[data-cookie-settings-button]');
    if (settingsButton) {
      /** @type {HTMLElement} */ (settingsButton).click();
    } else {
      // If button doesn't exist, user hasn't consented yet - reload to show banner
      localStorage.removeItem('cookie_consent_preferences');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Back Navigation */}
        <Link 
          to={createPageUrl('Home')} 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'el' ? 'Επιστροφή στην Αρχική' : 'Back to Home'}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {language === 'el' ? 'Πολιτική Cookies' : 'Cookie Policy'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'el' ? 'Τελευταία ενημέρωση: 15 Φεβρουαρίου 2026' : 'Last updated: February 15, 2026'}
          </p>
        </div>

        {/* Change Preferences Button */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-2">
                {language === 'el' ? 'Διαχείριση Προτιμήσεων Cookies' : 'Manage Cookie Preferences'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'el'
                  ? 'Μπορείτε να αλλάξετε τις προτιμήσεις σας οποιαδήποτε στιγμή. Η ανάκληση συγκατάθεσης είναι εξίσου εύκολη με την παροχή της.'
                  : 'You can change your preferences at any time. Withdrawing consent is as easy as giving it.'}
              </p>
            </div>
            <Button onClick={handleOpenPreferences} className="shrink-0">
              <Settings className="w-4 h-4 mr-2" />
              {language === 'el' ? 'Αλλαγή Προτιμήσεων' : 'Change Preferences'}
            </Button>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <h2 className="font-semibold mb-3">{language === 'el' ? 'Περιεχόμενα' : 'Table of Contents'}</h2>
          <nav className="space-y-2 text-sm">
            <a href="#what-are-cookies" className="block text-primary hover:underline">1. {language === 'el' ? 'Τι είναι τα Cookies' : 'What Are Cookies'}</a>
            <a href="#why-we-use" className="block text-primary hover:underline">2. {language === 'el' ? 'Γιατί Χρησιμοποιούμε Cookies' : 'Why We Use Cookies'}</a>
            <a href="#cookie-categories" className="block text-primary hover:underline">3. {language === 'el' ? 'Κατηγορίες Cookies' : 'Cookie Categories'}</a>
            <a href="#cookie-table" className="block text-primary hover:underline">4. {language === 'el' ? 'Πίνακας Cookies' : 'Cookie Table'}</a>
            <a href="#third-party" className="block text-primary hover:underline">5. {language === 'el' ? 'Τρίτα Μέρη' : 'Third-Party Services'}</a>
            <a href="#consent" className="block text-primary hover:underline">6. {language === 'el' ? 'Συγκατάθεση και Διαχείριση' : 'Consent and Management'}</a>
            <a href="#contact" className="block text-primary hover:underline">7. {language === 'el' ? 'Επικοινωνία' : 'Contact Us'}</a>
          </nav>
        </div>

        {/* Content Sections */}
        <div className="prose prose-sm md:prose-base max-w-none space-y-8">
          
          {/* Section 1: What Are Cookies */}
          <section id="what-are-cookies">
            <h2 className="text-2xl font-semibold mb-4">
              1. {language === 'el' ? 'Τι Είναι τα Cookies' : 'What Are Cookies'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {language === 'el'
                ? 'Τα cookies είναι μικρά αρχεία κειμένου που τοποθετούνται στη συσκευή σας (υπολογιστής, smartphone, tablet) όταν επισκέπτεστε έναν ιστότοπο. Χρησιμοποιούνται ευρέως για να κάνουν τους ιστότοπους να λειτουργούν αποτελεσματικότερα, να παρέχουν πληροφορίες στους ιδιοκτήτες του ιστότοπου και να βελτιώνουν την εμπειρία χρήστη.'
                : 'Cookies are small text files placed on your device (computer, smartphone, tablet) when you visit a website. They are widely used to make websites work more efficiently, provide information to site owners, and improve user experience.'}
            </p>
          </section>

          {/* Section 2: Why We Use Cookies */}
          <section id="why-we-use">
            <h2 className="text-2xl font-semibold mb-4">
              2. {language === 'el' ? 'Γιατί Χρησιμοποιούμε Cookies' : 'Why We Use Cookies'}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {language === 'el'
                ? 'Χρησιμοποιούμε cookies για τους ακόλουθους λόγους:'
                : 'We use cookies for the following purposes:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{language === 'el' ? 'Για να διατηρήσουμε τη σύνδεσή σας καθώς πλοηγείστε στην πλατφόρμα' : 'To keep you logged in as you navigate the platform'}</li>
              <li>{language === 'el' ? 'Για να θυμόμαστε τις προτιμήσεις σας (π.χ. γλώσσα)' : 'To remember your preferences (e.g., language)'}</li>
              <li>{language === 'el' ? 'Για να κατανοήσουμε πώς χρησιμοποιείτε την πλατφόρμα και να τη βελτιώσουμε' : 'To understand how you use the platform and improve it'}</li>
              <li>{language === 'el' ? 'Για να θυμόμαστε τις επιλογές σας σχετικά με τα cookies' : 'To remember your cookie consent choices'}</li>
            </ul>
          </section>

          {/* Section 3: Cookie Categories */}
          <section id="cookie-categories">
            <h2 className="text-2xl font-semibold mb-4">
              3. {language === 'el' ? 'Κατηγορίες Cookies' : 'Cookie Categories'}
            </h2>
            
            <div className="space-y-6">
              {/* Strictly Necessary */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'el' ? 'α) Απολύτως Απαραίτητα Cookies' : 'a) Strictly Necessary Cookies'}
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {language === 'el'
                      ? 'Αυτά τα cookies είναι απαραίτητα για τη λειτουργία της πλατφόρμας. Χωρίς αυτά, δεν μπορούμε να παρέχουμε τις υπηρεσίες που ζητάτε.'
                      : 'These cookies are essential for the platform to function. Without them, we cannot provide the services you request.'}
                  </p>
                  <p><strong>{language === 'el' ? 'Νομική Βάση:' : 'Legal Basis:'}</strong> {language === 'el' ? 'Απαραίτητο για την εκτέλεση της σύμβασης (ΓΚΠΔ Άρθρο 6.1.β)' : 'Necessary for contract performance (GDPR Art. 6.1.b)'}</p>
                  <p><strong>{language === 'el' ? 'Συγκατάθεση:' : 'Consent:'}</strong> {language === 'el' ? 'Δεν απαιτείται' : 'Not required'}</p>
                  <p className="text-xs text-muted-foreground italic">
                    {language === 'el'
                      ? 'Παραδείγματα: Cookies ελέγχου ταυτότητας, cookies ασφάλειας'
                      : 'Examples: Authentication cookies, security cookies'}
                  </p>
                </div>
              </div>

              {/* Analytics */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'el' ? 'β) Cookies Ανάλυσης (Analytics)' : 'b) Analytics Cookies'}
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {language === 'el'
                      ? 'Αυτά τα cookies μας βοηθούν να κατανοήσουμε πώς οι επισκέπτες αλληλεπιδρούν με την πλατφόρμα, συλλέγοντας πληροφορίες όπως ποιες σελίδες επισκέπτονται πιο συχνά.'
                      : 'These cookies help us understand how visitors interact with the platform by collecting information about which pages are visited most frequently.'}
                  </p>
                  <p><strong>{language === 'el' ? 'Νομική Βάση:' : 'Legal Basis:'}</strong> {language === 'el' ? 'Συγκατάθεση (ΓΚΠΔ Άρθρο 6.1.α)' : 'Consent (GDPR Art. 6.1.a)'}</p>
                  <p><strong>{language === 'el' ? 'Συγκατάθεση:' : 'Consent:'}</strong> <span className="text-amber-600 font-semibold">{language === 'el' ? 'Απαιτείται' : 'Required'}</span></p>
                  <p className="text-xs text-muted-foreground italic">
                    {language === 'el'
                      ? 'Παραδείγματα: Google Analytics'
                      : 'Examples: Google Analytics'}
                  </p>
                </div>
              </div>

              {/* Marketing */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'el' ? 'γ) Cookies Μάρκετινγκ' : 'c) Marketing Cookies'}
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {language === 'el'
                      ? 'Αυτά τα cookies χρησιμοποιούνται για την παρακολούθηση επισκεπτών σε ιστότοπους με σκοπό την προβολή διαφημίσεων που είναι σχετικές και ελκυστικές.'
                      : 'These cookies are used to track visitors across websites with the intent to display ads that are relevant and engaging.'}
                  </p>
                  <p><strong>{language === 'el' ? 'Νομική Βάση:' : 'Legal Basis:'}</strong> {language === 'el' ? 'Συγκατάθεση (ΓΚΠΔ Άρθρο 6.1.α)' : 'Consent (GDPR Art. 6.1.a)'}</p>
                  <p><strong>{language === 'el' ? 'Συγκατάθεση:' : 'Consent:'}</strong> <span className="text-amber-600 font-semibold">{language === 'el' ? 'Απαιτείται' : 'Required'}</span></p>
                  <p className="text-xs text-muted-foreground italic">
                    {language === 'el'
                      ? 'Σημείωση: Προς το παρόν δεν χρησιμοποιούμε cookies μάρκετινγκ'
                      : 'Note: We currently do not use marketing cookies'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
              <p className="text-sm text-muted-foreground">
                <strong>{language === 'el' ? '✓ Σημαντική Διευκρίνιση:' : '✓ Important Clarification:'}</strong> {language === 'el'
                  ? 'Τα μη απαραίτητα cookies (Analytics, Marketing) τοποθετούνται ΜΟΝΟ αφού δώσετε τη συγκατάθεσή σας μέσω του banner cookies. Δεν υπονοείται συγκατάθεση από συνεχή πλοήγηση, scrolling ή swipe.'
                  : 'Non-essential cookies (Analytics, Marketing) are set ONLY after you provide consent via the cookie banner. Consent is not implied by continued browsing, scrolling, or swiping.'}
              </p>
            </div>
          </section>

          {/* Section 4: Cookie Table */}
          <section id="cookie-table">
            <h2 className="text-2xl font-semibold mb-4">
              4. {language === 'el' ? 'Λεπτομερής Πίνακας Cookies' : 'Detailed Cookie Table'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'el'
                ? 'Παρακάτω είναι ένας πίνακας με τα cookies που χρησιμοποιούμε:'
                : 'Below is a table of the cookies we use:'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="border border-border p-3 text-left">{language === 'el' ? 'Όνομα Cookie' : 'Cookie Name'}</th>
                    <th className="border border-border p-3 text-left">{language === 'el' ? 'Πάροχος' : 'Provider'}</th>
                    <th className="border border-border p-3 text-left">{language === 'el' ? 'Σκοπός' : 'Purpose'}</th>
                    <th className="border border-border p-3 text-left">{language === 'el' ? 'Κατηγορία' : 'Category'}</th>
                    <th className="border border-border p-3 text-left">{language === 'el' ? 'Διάρκεια' : 'Duration'}</th>
                    <th className="border border-border p-3 text-left">{language === 'el' ? 'Νομική Βάση' : 'Legal Basis'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3"><code>auth_token</code></td>
                    <td className="border border-border p-3">{language === 'el' ? 'Πρώτο μέρος' : 'First party'}</td>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Διατήρηση σύνδεσης χρήστη' : 'User authentication'}
                    </td>
                    <td className="border border-border p-3">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-semibold">
                        {language === 'el' ? 'Απαραίτητο' : 'Necessary'}
                      </span>
                    </td>
                    <td className="border border-border p-3">{language === 'el' ? 'Σύνοδος / 30 ημέρες' : 'Session / 30 days'}</td>
                    <td className="border border-border p-3">{language === 'el' ? 'Σύμβαση' : 'Contract'}</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3"><code>cookie_consent_preferences</code></td>
                    <td className="border border-border p-3">{language === 'el' ? 'Πρώτο μέρος' : 'First party'}</td>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Αποθήκευση προτιμήσεων cookies' : 'Store cookie preferences'}
                    </td>
                    <td className="border border-border p-3">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-semibold">
                        {language === 'el' ? 'Απαραίτητο' : 'Necessary'}
                      </span>
                    </td>
                    <td className="border border-border p-3">{language === 'el' ? '365 ημέρες' : '365 days'}</td>
                    <td className="border border-border p-3">{language === 'el' ? 'Έννομο συμφέρον' : 'Legitimate interest'}</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3"><code>_ga</code></td>
                    <td className="border border-border p-3">{language === 'el' ? 'Google (τρίτο μέρος)' : 'Google (third party)'}</td>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Διάκριση χρηστών για αναλυτικά στοιχεία' : 'Distinguish users for analytics'}
                    </td>
                    <td className="border border-border p-3">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs font-semibold">
                        Analytics
                      </span>
                    </td>
                    <td className="border border-border p-3">{language === 'el' ? '2 χρόνια' : '2 years'}</td>
                    <td className="border border-border p-3">{language === 'el' ? 'Συγκατάθεση' : 'Consent'}</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3"><code>_ga_*</code></td>
                    <td className="border border-border p-3">{language === 'el' ? 'Google (τρίτο μέρος)' : 'Google (third party)'}</td>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Διατήρηση κατάστασης συνόδου (GA4)' : 'Persist session state (GA4)'}
                    </td>
                    <td className="border border-border p-3">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs font-semibold">
                        Analytics
                      </span>
                    </td>
                    <td className="border border-border p-3">{language === 'el' ? '2 χρόνια' : '2 years'}</td>
                    <td className="border border-border p-3">{language === 'el' ? 'Συγκατάθεση' : 'Consent'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5: Third-Party Services */}
          <section id="third-party">
            <h2 className="text-2xl font-semibold mb-4">
              5. {language === 'el' ? 'Υπηρεσίες Τρίτων' : 'Third-Party Services'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'el'
                ? 'Χρησιμοποιούμε τις ακόλουθες υπηρεσίες τρίτων που ενδέχεται να τοποθετήσουν cookies:'
                : 'We use the following third-party services that may set cookies:'}
            </p>
            
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Google Analytics (GA4)</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {language === 'el'
                    ? 'Χρησιμοποιούμε το Google Analytics για να κατανοήσουμε πώς χρησιμοποιείται η πλατφόρμα μας.'
                    : 'We use Google Analytics to understand how our platform is being used.'}
                </p>
                <div className="space-y-1 text-sm">
                  <p><strong>{language === 'el' ? 'Πάροχος:' : 'Provider:'}</strong> Google LLC</p>
                  <p><strong>{language === 'el' ? 'Κατηγορία:' : 'Category:'}</strong> Analytics</p>
                  <p><strong>{language === 'el' ? 'Πολιτική Απορρήτου:' : 'Privacy Policy:'}</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://policies.google.com/privacy</a></p>
                  <p><strong>{language === 'el' ? 'Opt-out:' : 'Opt-out:'}</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://tools.google.com/dlpage/gaoptout</a></p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Consent and Management */}
          <section id="consent">
            <h2 className="text-2xl font-semibold mb-4">
              6. {language === 'el' ? 'Συγκατάθεση και Διαχείριση Cookies' : 'Cookie Consent and Management'}
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">{language === 'el' ? 'Πώς να Δώσετε Συγκατάθεση' : 'How to Give Consent'}</h3>
                <p className="text-muted-foreground text-sm">
                  {language === 'el'
                    ? 'Όταν επισκέπτεστε την πλατφόρμα για πρώτη φορά, θα δείτε ένα banner cookies που σας ζητά να επιλέξετε τις προτιμήσεις σας. Μπορείτε να:'
                    : 'When you first visit the platform, you will see a cookie banner asking you to choose your preferences. You can:'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                  <li>{language === 'el' ? 'Κάντε κλικ στο "Αποδοχή Όλων" για να δεχτείτε όλα τα cookies' : 'Click "Accept All" to accept all cookies'}</li>
                  <li>{language === 'el' ? 'Κάντε κλικ στο "Απόρριψη Όλων" για να απορρίψετε μη απαραίτητα cookies' : 'Click "Reject All" to reject non-essential cookies'}</li>
                  <li>{language === 'el' ? 'Κάντε κλικ στο "Προσαρμογή" για να επιλέξετε μεμονωμένες κατηγορίες' : 'Click "Customize" to choose individual categories'}</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{language === 'el' ? 'Πώς να Αλλάξετε τις Προτιμήσεις Σας' : 'How to Change Your Preferences'}</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {language === 'el'
                    ? 'Μπορείτε να αλλάξετε τις προτιμήσεις cookies οποιαδήποτε στιγμή:'
                    : 'You can change your cookie preferences at any time:'}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>{language === 'el' ? 'Κάντε κλικ στο κουμπί "Ρυθμίσεις Cookies" στην κάτω δεξιά γωνία της οθόνης' : 'Click the "Cookie Settings" button in the bottom right corner'}</li>
                  <li>{language === 'el' ? 'Ή κάντε κλικ στο κουμπί "Αλλαγή Προτιμήσεων" παραπάνω' : 'Or click the "Change Preferences" button above'}</li>
                  <li>{language === 'el' ? 'Επιλέξτε τις νέες σας προτιμήσεις και αποθηκεύστε' : 'Select your new preferences and save'}</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{language === 'el' ? 'Πώς να Ανακαλέσετε τη Συγκατάθεση' : 'How to Withdraw Consent'}</h3>
                <p className="text-muted-foreground text-sm">
                  {language === 'el'
                    ? 'Η ανάκληση συγκατάθεσης είναι εξίσου εύκολη με την παροχή της. Απλά ανοίξτε τις ρυθμίσεις cookies και απενεργοποιήστε τις κατηγορίες που δεν θέλετε πλέον. Τα cookies θα αφαιρεθούν άμεσα.'
                    : 'Withdrawing consent is as easy as giving it. Simply open the cookie settings and disable the categories you no longer want. Cookies will be removed immediately.'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{language === 'el' ? 'Διαχείριση μέσω Προγράμματος Περιήγησης' : 'Browser Management'}</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  {language === 'el'
                    ? 'Μπορείτε επίσης να διαχειριστείτε cookies μέσω των ρυθμίσεων του προγράμματος περιήγησής σας:'
                    : 'You can also manage cookies through your browser settings:'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                  <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                  <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Apple Safari</a></li>
                  <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-6">
              <p className="text-sm">
                <strong>{language === 'el' ? '⚠️ Σημαντικό:' : '⚠️ Important:'}</strong> {language === 'el'
                  ? 'Η άρνηση cookies είναι εξίσου εύκολη με την αποδοχή τους. Δεν υπάρχει "cookie wall" - μπορείτε να χρησιμοποιήσετε την πλατφόρμα ακόμα κι αν απορρίψετε μη απαραίτητα cookies.'
                  : 'Refusing cookies is as easy as accepting them. There is no "cookie wall" - you can use the platform even if you reject non-essential cookies.'}
              </p>
            </div>
          </section>

          {/* Section 7: Contact */}
          <section id="contact">
            <h2 className="text-2xl font-semibold mb-4">
              7. {language === 'el' ? 'Επικοινωνήστε Μαζί Μας' : 'Contact Us'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'el'
                ? 'Για ερωτήσεις σχετικά με τη χρήση cookies, επικοινωνήστε μαζί μας:'
                : 'For questions about our use of cookies, please contact us:'}
            </p>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p><strong>Email:</strong> <code>[CONTACT_EMAIL]</code></p>
              <p><strong>{language === 'el' ? 'Αναφορά:' : 'Reference:'}</strong> {language === 'el' ? 'Πολιτική Cookies' : 'Cookie Policy'}</p>
            </div>
          </section>

          {/* Link to Privacy Policy */}
          <section className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
            <h3 className="font-semibold mb-2">
              {language === 'el' ? 'Διαβάστε την Πολιτική Απορρήτου μας' : 'Read Our Privacy Policy'}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {language === 'el'
                ? 'Για περισσότερες πληροφορίες σχετικά με το πώς επεξεργαζόμαστε τα προσωπικά σας δεδομένα, ανατρέξτε στην Πολιτική Απορρήτου μας.'
                : 'For more information about how we process your personal data, please refer to our Privacy Policy.'}
            </p>
            <Link to={createPageUrl('PrivacyPolicy')} className="text-primary hover:underline font-medium">
              {language === 'el' ? 'Πολιτική Απορρήτου →' : 'Privacy Policy →'}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}