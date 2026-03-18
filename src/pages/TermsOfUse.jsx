import React from 'react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '../components/contexts/LanguageContext';
import useSEO from '../components/seo/useSEO';

export default function TermsOfUsePage() {
  const { language } = useLanguage();

  useSEO({
    title: language === 'el' ? 'Όροι Χρήσης | Nature Explorers' : 'Terms of Use | Nature Explorers',
    description: language === 'el'
      ? 'Όροι Χρήσης της πλατφόρμας NatureExplorers.gr - Πληροφορίες για την λειτουργία της πλατφόρμας ως aggregator πεζοπορικών εκδρομών'
      : 'Terms of Use for NatureExplorers.gr platform - Information about platform operation as hiking trips aggregator',
    url: 'https://natureexplorers.gr/TermsOfUse',
    noindex: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 md:p-12">
          {language === 'el' ? (
            // Greek Content
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-8">
                Όροι Χρήσης – NatureExplorers.gr
              </h1>

              <div className="space-y-6 text-stone-700">
                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">1. Αντικείμενο</h2>
                  <p className="leading-relaxed">
                    Η ιστοσελίδα NatureExplorers.gr (εφεξής «Πλατφόρμα») λειτουργεί ως aggregator – συγκεντρωτική πλατφόρμα προβολής πληροφοριών για πεζοπορικές και ταξιδιωτικές εκδρομές που διοργανώνονται από ανεξάρτητους τρίτους διοργανωτές.
                  </p>
                  <p className="leading-relaxed mt-2">
                    Η Πλατφόρμα δεν διοργανώνει, δεν διαμεσολαβεί και δεν πωλεί οποιαδήποτε εκδρομή ή υπηρεσία.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">2. Πηγή πληροφοριών</h2>
                  <p className="leading-relaxed">
                    Οι πληροφορίες (τίτλος, ημερομηνία, περιγραφή, προορισμός, σύνδεσμος, φωτογραφία) προέρχονται αποκλειστικά από δημόσιες αναρτήσεις των διοργανωτών (ιστοσελίδες, κοινωνικά δίκτυα, δημόσιες πλατφόρμες).
                  </p>
                  <p className="leading-relaxed mt-2">Η Πλατφόρμα:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>δεν αλλοιώνει το περιεχόμενο των διοργανωτών,</li>
                    <li>παραπέμπει πάντοτε μέσω ενεργού συνδέσμου (link) προς την επίσημη πηγή της εκδρομής,</li>
                    <li>και δεν αποθηκεύει ή αναπαράγει φωτογραφίες ή κείμενα· οι εικόνες προβάλλονται μέσω συνδέσμου (embed) από τον αρχικό ιστότοπο του διοργανωτή.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">3. Πνευματικά δικαιώματα</h2>
                  <p className="leading-relaxed">
                    Όλα τα πνευματικά δικαιώματα των φωτογραφιών, λογοτύπων και περιγραφών ανήκουν στους αντίστοιχους διοργανωτές.
                    Η NatureExplorers.gr δεν διεκδικεί κανένα δικαίωμα επί αυτών και τα εμφανίζει αποκλειστικά για ενημερωτικούς και προωθητικούς σκοπούς.
                  </p>
                  <p className="leading-relaxed mt-2">
                    Αν κάποιος διοργανωτής ή κάτοχος περιεχομένου επιθυμεί την αφαίρεση ή τροποποίηση στοιχείων που τον αφορούν, μπορεί να επικοινωνήσει στο email{' '}
                    <a href="mailto:natureexplorersgr@gmail.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      natureexplorersgr@gmail.com
                    </a>
                    {' '}και το αίτημα θα ικανοποιηθεί άμεσα.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">4. Ευθύνη Πλατφόρμας</h2>
                  <p className="leading-relaxed">Η Πλατφόρμα δεν ευθύνεται για:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>την ακρίβεια, πληρότητα ή επικαιρότητα των πληροφοριών που προέρχονται από τρίτες πηγές,</li>
                    <li>την ασφάλεια, την οργάνωση ή την ποιότητα των εκδρομών,</li>
                    <li>τυχόν αλλαγές, ακυρώσεις ή ζημίες που μπορεί να προκύψουν από τη συμμετοχή των χρηστών σε δραστηριότητες τρίτων.</li>
                  </ul>
                  <p className="leading-relaxed mt-2">
                    Η συμμετοχή των χρηστών σε εκδρομές γίνεται αποκλειστικά με δική τους ευθύνη και σύμφωνα με τους όρους και προϋποθέσεις του εκάστοτε διοργανωτή.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">5. Χρήση της Πλατφόρμας</h2>
                  <p className="leading-relaxed">
                    Η Πλατφόρμα προορίζεται για ενημερωτική χρήση.
                    Απαγορεύεται η αναπαραγωγή, αντιγραφή ή μεταπώληση του περιεχομένου χωρίς άδεια του διαχειριστή.
                    Η χρήση της Πλατφόρμας συνεπάγεται την αποδοχή των παρόντων όρων.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">6. Επικοινωνία</h2>
                  <p className="leading-relaxed">
                    Για οποιοδήποτε θέμα που αφορά δικαιώματα, περιεχόμενο ή πληροφορίες, μπορείτε να επικοινωνείτε στο{' '}
                    <a href="mailto:natureexplorersgr@gmail.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      natureexplorersgr@gmail.com
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">7. Τροποποιήσεις</h2>
                  <p className="leading-relaxed">
                    Η NatureExplorers.gr διατηρεί το δικαίωμα να τροποποιεί οποτεδήποτε τους παρόντες όρους, χωρίς προηγούμενη ειδοποίηση. Οι αλλαγές τίθενται σε ισχύ από τη δημοσίευσή τους στην ιστοσελίδα.
                  </p>
                </section>
              </div>
            </>
          ) : (
            // English Content
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-8">
                Terms of Use – NatureExplorers.gr
              </h1>

              <div className="space-y-6 text-stone-700">
                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">1. Purpose</h2>
                  <p className="leading-relaxed">
                    The website NatureExplorers.gr (hereinafter the "Platform") operates as an aggregator – a centralized platform that collects and displays public information about hiking and travel events organized by independent third-party organizers.
                  </p>
                  <p className="leading-relaxed mt-2">
                    The Platform does not organize, mediate, or sell any trip or activity.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">2. Source of Information</h2>
                  <p className="leading-relaxed">
                    All information displayed on the Platform (title, date, description, destination, link, image) is obtained exclusively from publicly available posts published by third-party organizers (official websites, social media pages, or public platforms).
                  </p>
                  <p className="leading-relaxed mt-2">The Platform:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>does not alter or modify any original content,</li>
                    <li>always provides an active hyperlink directing users to the official source of each event,</li>
                    <li>and does not store or re-upload any images or text; images are displayed via direct embedding (hotlink) from the organizer's original website.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">3. Intellectual Property Rights</h2>
                  <p className="leading-relaxed">
                    All copyrights and intellectual property rights for photos, logos, and text belong to their respective organizers or owners.
                    NatureExplorers.gr claims no ownership over such content and displays it solely for informational and promotional purposes.
                  </p>
                  <p className="leading-relaxed mt-2">
                    If any organizer or content owner wishes their materials to be removed or modified, they may contact{' '}
                    <a href="mailto:natureexplorersgr@gmail.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      natureexplorersgr@gmail.com
                    </a>
                    , and the request will be processed immediately.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">4. Platform Liability</h2>
                  <p className="leading-relaxed">The Platform shall not be held responsible for:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>the accuracy, completeness, or timeliness of information originating from third-party sources,</li>
                    <li>the safety, organization, or quality of the events,</li>
                    <li>or any changes, cancellations, or damages that may occur from participation in activities organized by third parties.</li>
                  </ul>
                  <p className="leading-relaxed mt-2">
                    Participation in any event is done at the user's own risk and is subject to the terms and conditions of each respective organizer.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">5. Use of the Platform</h2>
                  <p className="leading-relaxed">
                    The Platform is intended for informational purposes only.
                    It is prohibited to reproduce, copy, or resell any part of the Platform's content without prior written consent from the administrator.
                    By accessing or using the Platform, users accept these Terms of Use in full.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">6. Contact</h2>
                  <p className="leading-relaxed">
                    For any matter related to copyrights, content, or information displayed on the Platform, please contact{' '}
                    <a href="mailto:natureexplorersgr@gmail.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      natureexplorersgr@gmail.com
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-stone-900 mb-3">7. Modifications</h2>
                  <p className="leading-relaxed">
                    NatureExplorers.gr reserves the right to modify these Terms of Use at any time without prior notice.
                    Any updates become effective immediately upon publication on the website.
                  </p>
                </section>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}