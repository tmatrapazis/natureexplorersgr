import React from "react";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { aboutTranslations } from "@/components/translations/about";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mountain, Users, MapPin, Shield, Heart, Sprout, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import useSEO from "../components/seo/useSEO";

export default function About() {
  const { language } = useLanguage();
  const t = aboutTranslations[language];
  const navigate = useNavigate();

  useSEO({
    title: language === 'el'
      ? 'Σχετικά με εμάς | Nature Explorers | Πλατφόρμα Πεζοπορίας Ελλάδα'
      : 'About Us | Nature Explorers | Hiking & Trekking Platform Greece',
    description: language === 'el'
      ? 'Μάθετε για την Nature Explorers - την #1 πλατφόρμα για οργανωμένες εκδρομές πεζοπορίας και trekking στην Ελλάδα. Η αποστολή μας, η ομάδα μας και οι αξίες μας.'
      : 'Learn about Nature Explorers - the #1 platform for organized hiking trips and trekking adventures in Greece. Our mission, team, and values.',
    url: 'https://natureexplorers.gr/About',
    type: 'website',
  });

  const stats = [
    { value: "500+",  label: t.stats.trips,       icon: Mountain },
    { value: "50+",   label: t.stats.organizers,  icon: Users    },
    { value: "5000+", label: t.stats.hikers,       icon: Heart    },
    { value: "100+",  label: t.stats.mountains,    icon: MapPin   },
  ];

  const featureIcons = [Shield, MapPin, Globe, Users];
  const valueIcons   = [Shield, Sprout, Users, Heart];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-stone-50">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-stone-600/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* H1 — primary SEO heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── }
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <Card key={idx} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Icon className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
                    <div className="text-3xl font-bold text-stone-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-stone-600">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      { ── Who We Are ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            {t.whoWeAre.title}
          </h2>
          <p className="text-lg text-stone-700 leading-relaxed">
            {t.whoWeAre.description}
          </p>
        </div>
      </section>

      {/* ── Mission & Story ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          <div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4">{t.mission.title}</h2>
            <p className="text-lg text-stone-700 leading-relaxed">
              {t.mission.description}
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4">{t.story.title}</h2>
            <p className="text-lg text-stone-700 leading-relaxed">
              {t.story.description}
            </p>
          </div>
        </div>
      </section>

      {/* ── What We Offer (Features) ─────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-12 text-center">
            {t.features.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {t.features.items.map((feature, idx) => {
              const Icon = featureIcons[idx];
              return (
                <Card key={idx} className="hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <Icon className="w-10 h-10 text-emerald-600 mb-3" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-stone-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why Nature Explorers ────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            {t.whyUs.title}
          </h2>
          <p className="text-lg text-stone-700 leading-relaxed">
            {t.whyUs.description}
          </p>
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 mb-12 text-center">
            {t.values.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {t.values.items.map((value, idx) => {
              const Icon = valueIcons[idx];
              return (
                <Card key={idx} className="hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="w-8 h-8 text-emerald-600" />
                      <CardTitle className="text-xl">{value.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-stone-600">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.cta.title}</h2>
          <p className="text-xl mb-8 text-emerald-50">{t.cta.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate(createPageUrl("Calendar"))}
              className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-6 min-h-[44px]"
              aria-label={t.cta.button}
            >
              {t.cta.button}
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}