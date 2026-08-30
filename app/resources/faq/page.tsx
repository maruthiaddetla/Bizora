import type { Metadata } from "next";
import Link from "next/link";
import { ResourceArticleLayout } from "@/components/resources/ResourceArticleLayout";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about buying and selling businesses, finding commercial spaces, and using Bizora in India.",
  openGraph: {
    title: "Frequently Asked Questions",
    description:
      "Answers to common questions about buying and selling businesses, finding commercial spaces, and using Bizora in India.",
  },
};

const faqs = [
  {
    question: "What is Bizora?",
    answer:
      "Bizora is an India-focused marketplace where people can discover businesses for sale and commercial spaces, list opportunities, and send enquiries to sellers.",
  },
  {
    question: "Do I need an account to browse listings?",
    answer:
      "You can browse public listings without signing in. Creating an account is required for favourites, sending enquiries, managing listings, and using your dashboard.",
  },
  {
    question: "Do I need an account to read Resources?",
    answer:
      "No. Resource guides and FAQs are public so buyers and sellers can learn before they take action.",
  },
  {
    question: "How does listing a business work?",
    answer:
      "Sellers create a listing, save progress as needed, and submit it for review. Approved listings can become visible to potential buyers on Bizora.",
  },
  {
    question: "Does Bizora guarantee a sale or purchase?",
    answer:
      "No. Bizora helps people discover opportunities and connect. Completing a transaction, negotiating terms, and verifying details remain the responsibility of the parties involved and their advisors.",
  },
  {
    question: "Are the guides on this site professional advice?",
    answer:
      "No. Resource articles are general information only. For legal, tax, accounting, or financial decisions, consult qualified professionals.",
  },
] as const;

export default function ResourcesFaqPage() {
  return (
    <ResourceArticleLayout
      title="Frequently Asked Questions"
      description="Quick answers about using Bizora to buy, sell, or find commercial space in India."
    >
      {faqs.map((faq) => (
        <section key={faq.question}>
          <h2>{faq.question}</h2>
          <p>{faq.answer}</p>
        </section>
      ))}

      <section>
        <h2>Still have a question?</h2>
        <p>
          Visit{" "}
          <Link
            href="/about"
            className="font-medium text-primary hover:text-primary-hover"
          >
            How Bizora Works
          </Link>{" "}
          or{" "}
          <Link
            href="/contact"
            className="font-medium text-primary hover:text-primary-hover"
          >
            Contact Us
          </Link>{" "}
          for more help.
        </p>
      </section>
    </ResourceArticleLayout>
  );
}
