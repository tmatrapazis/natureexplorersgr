import React from 'react';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { useSEO } from '@/components/seo/useSEO';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { useBackNavigation } from '../lib/useBackNavigation';

export default function PrivacyPolicy() {
  const { language } = useLanguage();
  const { goBack, backLabel } = useBackNavigation(createPageUrl('Home'));

  useSEO({
    title: language === 'el' ? 'Πολιτική Απορρήτου | Nature Explorers' : 'Privacy Policy | Nature Explorers',
    description: language === 'el'
      ? 'Μάθετε πώς συλλέγουμε, χρησιμοποιούμε και προστατεύουμε τα προσωπικά σας δεδομένα.'
      : 'Learn how we collect, use, and protect your personal data in compliance with GDPR.',
    url: 'https://natureexplorers.gr/PrivacyPolicy',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Back Navigation */}
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors min-h-[44px]"
          aria-label={`Go back to ${backLabel}`}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {backLabel}
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {language === 'el' ? 'Πολιτική Απορρήτου' : 'Privacy Policy'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'el' ? 'Τελευταία ενημέρωση: 15 Φεβρουαρίου 2026' : 'Last updated: February 15, 2026'}
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <h2 className="font-semibold mb-3">{language === 'el' ? 'Περιεχόμενα' : 'Table of Contents'}</h2>
          <nav className="space-y-2 text-sm">
            <a href="#controller" className="block text-primary hover:underline">1. {language === 'el' ? 'Υπεύθυνος Επεξεργασίας' : 'Data Controller'}</a>
            <a href="#data-collected" className="block text-primary hover:underline">2. {language === 'el' ? 'Δεδομένα που Συλλέγουμε' : 'Data We Collect'}</a>
            <a href="#purposes" className="block text-primary hover:underline">3. {language === 'el' ? 'Σκοποί και Νομική Βάση' : 'Purposes and Legal Basis'}</a>
            <a href="#recipients" className="block text-primary hover:underline">4. {language === 'el' ? 'Αποδέκτες Δεδομένων' : 'Data Recipients'}</a>
            <a href="#international" className="block text-primary hover:underline">5. {language === 'el' ? 'Διεθνείς Μεταφορές' : 'International Transfers'}</a>
            <a href="#retention" className="block text-primary hover:underline">6. {language === 'el' ? 'Διατήρηση Δεδομένων' : 'Data Retention'}</a>
            <a href="#rights" className="block text-primary hover:underline">7. {language === 'el' ? 'Τα Δικαιώματά Σας' : 'Your Rights'}</a>
            <a href="#automated" className="block text-primary hover:underline">8. {language === 'el' ? 'Αυτοματοποιημένες Αποφάσεις' : 'Automated Decision-Making'}</a>
            <a href="#security" className="block text-primary hover:underline">9. {language === 'el' ? 'Ασφάλεια' : 'Security'}</a>
            <a href="#contact" className="block text-primary hover:underline">10. {language === 'el' ? 'Επικοινωνία' : 'Contact Us'}</a>
          </nav>
        </div>

        {/* Content Sections */}
        <div className="prose prose-sm md:prose-base max-w-none space-y-8">
          
          {/* Section 1: Data Controller */}
          <section id="controller">
            <h2 className="text-2xl font-semibold mb-4">
              1. {language === 'el' ? 'Υπεύθυνος Επεξεργασίας Δεδομένων' : 'Data Controller'}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {language === 'el' 
                ? 'Ο υπεύθυνος επεξεργασίας των προσωπικών σας δεδομένων είναι:'
                : 'The data controller responsible for your personal data is:'}
            </p>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p><strong>{language === 'el' ? 'Επωνυμία:' : 'Legal Entity:'}</strong> <code>[LEGAL_ENTITY_NAME]</code></p>
              <p><strong>{language === 'el' ? 'Διεύθυνση:' : 'Address:'}</strong> <code>[REGISTERED_ADDRESS]</code></p>
              <p><strong>{language === 'el' ? 'Email Επικοινωνίας:' : 'Contact Email:'}</strong> <code>[CONTACT_EMAIL]</code></p>
              <p><strong>{language === 'el' ? 'Υπεύθυνος Προστασίας Δεδομένων (DPO):' : 'Data Protection Officer (DPO):'}</strong> <code>[DPO_EMAIL]</code></p>
            </div>
          </section>

          {/* Section 2: Data We Collect */}
          <section id="data-collected">
            <h2 className="text-2xl font-semibold mb-4">
              2. {language === 'el' ? 'Κατηγορίες Προσωπικών Δεδομένων που Συλλέγουμε' : 'Categories of Personal Data We Collect'}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{language === 'el' ? 'α) Δεδομένα Λογαριασμού' : 'a) Account Data'}</h3>
                <p className="text-muted-foreground">
                  {language === 'el' 
                    ? 'Όνομα, email, κωδικός πρόσβασης (κρυπτογραφημένος), ρόλος χρήστη (οργανωτής/οδοιπόρος).'
                    : 'Full name, email address, password (encrypted), user role (organizer/hiker).'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{language === 'el' ? 'β) Δεδομένα Προφίλ' : 'b) Profile Data'}</h3>
                <p className="text-muted-foreground">
                  {language === 'el'
                    ? 'Φωτογραφία προφίλ, βιογραφικό, τηλέφωνο επικοινωνίας, πιστοποιήσεις, χρόνια εμπειρίας, κοινωνικά δίκτυα.'
                    : 'Profile picture, bio, phone number, certifications, years of experience, social media links.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{language === 'el' ? 'γ) Δεδομένα Κρατήσεων' : 'c) Booking Data'}</h3>
                <p className="text-muted-foreground">
                  {language === 'el'
                    ? 'Στοιχεία εκδρομής, αριθμός ατόμων, ειδικές απαιτήσεις, κατάσταση κράτησης.'
                    : 'Trip details, number of people, special requirements, booking status.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{language === 'el' ? 'δ) Τεχνικά Δεδομένα' : 'd) Technical Data'}</h3>
                <p className="text-muted-foreground">
                  {language === 'el'
                    ? 'Διεύθυνση IP, τύπος προγράμματος περιήγησης, συσκευή, cookies, στοιχεία χρήσης της πλατφόρμας.'
                    : 'IP address, browser type, device information, cookies, usage analytics.'}
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Purposes and Legal Basis */}
          <section id="purposes">
            <h2 className="text-2xl font-semibold mb-4">
              3. {language === 'el' ? 'Σκοποί Επεξεργασίας και Νομική Βάση' : 'Purposes of Processing and Legal Basis'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="border border-border p-3 text-left">{language === 'el' ? 'Σκοπός' : 'Purpose'}</th>
                    <th className="border border-border p-3 text-left">{language === 'el' ? 'Νομική Βάση' : 'Legal Basis'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Δημιουργία και διαχείριση λογαριασμού χρήστη' : 'Account creation and management'}
                    </td>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Εκτέλεση σύμβασης (ΓΚΠΔ Άρθρο 6.1.β)' : 'Performance of contract (GDPR Art. 6.1.b)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Επεξεργασία κρατήσεων εκδρομών' : 'Processing trip bookings'}
                    </td>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Εκτέλεση σύμβασης (ΓΚΠΔ Άρθρο 6.1.β)' : 'Performance of contract (GDPR Art. 6.1.b)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Επικοινωνία με χρήστες (ειδοποιήσεις, υποστήριξη)' : 'User communication (notifications, support)'}
                    </td>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Έννομο συμφέρον (ΓΚΠΔ Άρθρο 6.1.στ)' : 'Legitimate interest (GDPR Art. 6.1.f)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Ανάλυση χρήσης πλατφόρμας (Google Analytics)' : 'Platform usage analytics (Google Analytics)'}
                    </td>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Συγκατάθεση (ΓΚΠΔ Άρθρο 6.1.α)' : 'Consent (GDPR Art. 6.1.a)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Συμμόρφωση με νομικές υποχρεώσεις' : 'Compliance with legal obligations'}
                    </td>
                    <td className="border border-border p-3">
                      {language === 'el' ? 'Νομική υποχρέωση (ΓΚΠΔ Άρθρο 6.1.γ)' : 'Legal obligation (GDPR Art. 6.1.c)'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {language === 'el'
                ? '⚠️ Για μη απαραίτητα cookies (π.χ. analytics), θα ζητήσουμε τη συγκατάθεσή σας πριν τη χρήση τους. Δεν υπονοείται συγκατάθεση από την πλοήγηση.'
                : '⚠️ For non-essential cookies (e.g., analytics), we will request your consent before using them. Consent is not implied by continued browsing.'}
            </p>
          </section>

          {/* Section 4: Recipients */}
          <section id="recipients">
            <h2 className="text-2xl font-semibold mb-4">
              4. {language === 'el' ? 'Αποδέκτες ή Κατηγορίες Αποδεκτών' : 'Recipients or Categories of Recipients'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'el'
                ? 'Τα προσωπικά σας δεδομένα μπορεί να κοινοποιηθούν στις ακόλουθες κατηγορίες αποδεκτών:'
                : 'Your personal data may be disclosed to the following categories of recipients:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{language === 'el' ? 'Πάροχοι υπηρεσιών φιλοξενίας (hosting providers)' : 'Hosting service providers'}</li>
              <li>{language === 'el' ? 'Αναλυτικές υπηρεσίες (π.χ. Google Analytics)' : 'Analytics services (e.g., Google Analytics)'}</li>
              <li>{language === 'el' ? 'Υπηρεσίες email (π.χ. Resend, SendGrid)' : 'Email service providers (e.g., Resend, SendGrid)'}</li>
              <li>{language === 'el' ? 'Πάροχοι πληρωμών (αν εφαρμόζεται)' : 'Payment processors (if applicable)'}</li>
              <li>{language === 'el' ? 'Νομικοί σύμβουλοι και ελεγκτές' : 'Legal advisors and auditors'}</li>
              <li>{language === 'el' ? 'Δημόσιες αρχές (κατόπιν νόμιμου αιτήματος)' : 'Public authorities (upon lawful request)'}</li>
            </ul>
          </section>

          {/* Section 5: International Transfers */}
          <section id="international">
            <h2 className="text-2xl font-semibold mb-4">
              5. {language === 'el' ? 'Διεθνείς Μεταφορές Δεδομένων' : 'International Data Transfers'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'el'
                ? 'Ορισμένοι πάροχοι υπηρεσιών μας (π.χ. Google Analytics) ενδέχεται να επεξεργάζονται δεδομένα εκτός του Ευρωπαϊκού Οικονομικού Χώρου (ΕΟΧ).'
                : 'Some of our service providers (e.g., Google Analytics) may process data outside the European Economic Area (EEA).'}
            </p>
            <p className="text-muted-foreground mb-4">
              {language === 'el'
                ? 'Όταν πραγματοποιούμε διεθνείς μεταφορές, εφαρμόζουμε κατάλληλες εγγυήσεις όπως:'
                : 'When we transfer data internationally, we implement appropriate safeguards such as:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{language === 'el' ? 'Αποφάσεις επάρκειας της Ευρωπαϊκής Επιτροπής' : 'European Commission adequacy decisions'}</li>
              <li>{language === 'el' ? 'Τυποποιημένες συμβατικές ρήτρες (SCCs)' : 'Standard Contractual Clauses (SCCs)'}</li>
              <li>{language === 'el' ? 'Πιστοποιήσεις όπως το EU-U.S. Data Privacy Framework' : 'Certifications such as the EU-U.S. Data Privacy Framework'}</li>
            </ul>
          </section>

          {/* Section 6: Retention */}
          <section id="retention">
            <h2 className="text-2xl font-semibold mb-4">
              6. {language === 'el' ? 'Περίοδος Διατήρησης Δεδομένων' : 'Data Retention Period'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'el'
                ? 'Διατηρούμε τα προσωπικά σας δεδομένα μόνο για όσο διάστημα είναι απαραίτητο για τους σκοπούς που συλλέχθηκαν:'
                : 'We retain your personal data only for as long as necessary for the purposes collected:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>{language === 'el' ? 'Δεδομένα λογαριασμού:' : 'Account data:'}</strong> {language === 'el' ? 'Μέχρι να διαγράψετε τον λογαριασμό σας ή 3 χρόνια αδράνειας' : 'Until you delete your account or 3 years of inactivity'}</li>
              <li><strong>{language === 'el' ? 'Δεδομένα κρατήσεων:' : 'Booking data:'}</strong> {language === 'el' ? '5 χρόνια για λογιστικούς/νομικούς λόγους' : '5 years for accounting/legal purposes'}</li>
              <li><strong>{language === 'el' ? 'Τεχνικά δεδομένα (analytics):' : 'Technical data (analytics):'}</strong> {language === 'el' ? '14 μήνες (σύμφωνα με το Google Analytics)' : '14 months (per Google Analytics settings)'}</li>
              <li><strong>{language === 'el' ? 'Αρχεία καταγραφής (logs):' : 'Server logs:'}</strong> {language === 'el' ? 'Μέχρι 90 ημέρες' : 'Up to 90 days'}</li>
            </ul>
          </section>

          {/* Section 7: Your Rights */}
          <section id="rights">
            <h2 className="text-2xl font-semibold mb-4">
              7. {language === 'el' ? 'Τα Δικαιώματά Σας' : 'Your Data Subject Rights'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'el'
                ? 'Σύμφωνα με το ΓΚΠΔ, έχετε τα ακόλουθα δικαιώματα:'
                : 'Under GDPR, you have the following rights:'}
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{language === 'el' ? '✓ Δικαίωμα Πρόσβασης (Άρθρο 15)' : '✓ Right of Access (Article 15)'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'el'
                    ? 'Μπορείτε να ζητήσετε αντίγραφο των δεδομένων σας και πληροφορίες για την επεξεργασία τους.'
                    : 'Request a copy of your personal data and information about how we process it.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">{language === 'el' ? '✓ Δικαίωμα Διόρθωσης (Άρθρο 16)' : '✓ Right to Rectification (Article 16)'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'el'
                    ? 'Διορθώστε ανακριβή ή ημιτελή δεδομένα.'
                    : 'Correct inaccurate or incomplete personal data.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">{language === 'el' ? '✓ Δικαίωμα Διαγραφής / "Δικαίωμα στη Λήθη" (Άρθρο 17)' : '✓ Right to Erasure / "Right to be Forgotten" (Article 17)'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'el'
                    ? 'Ζητήστε τη διαγραφή των δεδομένων σας υπό ορισμένες προϋποθέσεις.'
                    : 'Request deletion of your data under certain conditions.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">{language === 'el' ? '✓ Δικαίωμα Περιορισμού της Επεξεργασίας (Άρθρο 18)' : '✓ Right to Restriction of Processing (Article 18)'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'el'
                    ? 'Περιορίστε την επεξεργασία των δεδομένων σας υπό ορισμένες συνθήκες.'
                    : 'Restrict how we process your data under certain circumstances.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">{language === 'el' ? '✓ Δικαίωμα Φορητότητας (Άρθρο 20)' : '✓ Right to Data Portability (Article 20)'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'el'
                    ? 'Λάβετε τα δεδομένα σας σε δομημένη, μηχαναγνώσιμη μορφή.'
                    : 'Receive your data in a structured, machine-readable format.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">{language === 'el' ? '✓ Δικαίωμα Εναντίωσης (Άρθρο 21)' : '✓ Right to Object (Article 21)'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'el'
                    ? 'Αντιταχθείτε στην επεξεργασία που βασίζεται σε έννομα συμφέροντα ή απευθείας μάρκετινγκ.'
                    : 'Object to processing based on legitimate interests or direct marketing.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">{language === 'el' ? '✓ Δικαίωμα Ανάκλησης Συγκατάθεσης' : '✓ Right to Withdraw Consent'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'el'
                    ? 'Ανακαλέστε τη συγκατάθεσή σας οποιαδήποτε στιγμή (π.χ. για cookies analytics). Η ανάκληση είναι εξίσου εύκολη με την παροχή συγκατάθεσης.'
                    : 'Withdraw your consent at any time (e.g., for analytics cookies). Withdrawing consent is as easy as giving it.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">{language === 'el' ? '✓ Δικαίωμα Υποβολής Καταγγελίας' : '✓ Right to Lodge a Complaint'}</h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'el'
                    ? 'Υποβάλετε καταγγελία στην αρμόδια εποπτική αρχή:'
                    : 'Lodge a complaint with the competent supervisory authority:'}
                </p>
                <div className="bg-muted/30 rounded p-3 mt-2">
                  <p className="text-sm"><strong>{language === 'el' ? 'Αρχή:' : 'Authority:'}</strong> <code>[SUPERVISORY_AUTHORITY_NAME]</code></p>
                  <p className="text-sm"><strong>{language === 'el' ? 'Ιστοσελίδα:' : 'Website:'}</strong> <code>[SUPERVISORY_AUTHORITY_URL]</code></p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              {language === 'el'
                ? '📧 Για να ασκήσετε οποιοδήποτε από τα παραπάνω δικαιώματα, επικοινωνήστε μαζί μας στο [CONTACT_EMAIL]'
                : '📧 To exercise any of these rights, contact us at [CONTACT_EMAIL]'}
            </p>
          </section>

          {/* Section 8: Automated Decision-Making */}
          <section id="automated">
            <h2 className="text-2xl font-semibold mb-4">
              8. {language === 'el' ? 'Αυτοματοποιημένες Αποφάσεις και Προφίλ' : 'Automated Decision-Making and Profiling'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'el'
                ? 'Δεν χρησιμοποιούμε αυτοματοποιημένες αποφάσεις ή προφίλ που παράγουν νομικά ή σημαντικά αποτελέσματα για εσάς.'
                : 'We do not use automated decision-making or profiling that produces legal or similarly significant effects concerning you.'}
            </p>
          </section>

          {/* Section 9: Security */}
          <section id="security">
            <h2 className="text-2xl font-semibold mb-4">
              9. {language === 'el' ? 'Ασφάλεια Δεδομένων' : 'Data Security'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'el'
                ? 'Λαμβάνουμε κατάλληλα τεχνικά και οργανωτικά μέτρα για την προστασία των δεδομένων σας, συμπεριλαμβανομένων:'
                : 'We implement appropriate technical and organizational measures to protect your data, including:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{language === 'el' ? 'Κρυπτογράφηση δεδομένων (HTTPS/TLS)' : 'Data encryption (HTTPS/TLS)'}</li>
              <li>{language === 'el' ? 'Κρυπτογραφημένοι κωδικοί πρόσβασης (hashing)' : 'Encrypted passwords (hashing)'}</li>
              <li>{language === 'el' ? 'Έλεγχοι πρόσβασης και εξουσιοδότηση' : 'Access controls and authorization'}</li>
              <li>{language === 'el' ? 'Τακτική παρακολούθηση ασφάλειας' : 'Regular security monitoring'}</li>
            </ul>
          </section>

          {/* Section 10: Contact */}
          <section id="contact">
            <h2 className="text-2xl font-semibold mb-4">
              10. {language === 'el' ? 'Επικοινωνήστε Μαζί Μας' : 'Contact Us'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'el'
                ? 'Για οποιαδήποτε ερώτηση σχετικά με την παρούσα Πολιτική Απορρήτου ή την επεξεργασία των δεδομένων σας, επικοινωνήστε μαζί μας:'
                : 'For any questions about this Privacy Policy or the processing of your data, please contact us:'}
            </p>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p><strong>Email:</strong> <code>[CONTACT_EMAIL]</code></p>
              <p><strong>{language === 'el' ? 'Υπεύθυνος Προστασίας Δεδομένων:' : 'Data Protection Officer:'}</strong> <code>[DPO_EMAIL]</code></p>
            </div>
          </section>

          {/* Mandatory Provision Notice */}
          <section className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mt-8">
            <h3 className="font-semibold mb-2">
              {language === 'el' ? '⚠️ Υποχρεωτική Παροχή Δεδομένων' : '⚠️ Mandatory Provision of Data'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'el'
                ? 'Η παροχή ορισμένων προσωπικών δεδομένων (όνομα, email) είναι απαραίτητη για τη δημιουργία λογαριασμού και τη χρήση της πλατφόρμας. Αν δεν παρέχετε αυτά τα δεδομένα, δεν θα μπορούμε να σας παρέχουμε τις υπηρεσίες μας.'
                : 'The provision of certain personal data (name, email) is necessary for account creation and use of the platform. If you do not provide this data, we will not be able to provide our services to you.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}