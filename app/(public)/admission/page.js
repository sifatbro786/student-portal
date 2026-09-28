import Image from "next/image";
import { issueFormToken } from "@/server/form-token.js";
import { admissionFormOptions } from "@/server/services/admissions.js";
import { AdmissionForm } from "./AdmissionForm.js";

export const dynamic = "force-dynamic"; // fresh anti-spam token + live class list

export const metadata = {
    title: "Admission",
    description:
        "Apply for O Level English Language classes with Tauhid Mostafa in Dhanmondi and Uttara, Dhaka. Cambridge & Edexcel.",
    alternates: { canonical: "/admission" },
};

const STEPS = [
    ["01", "Sit the admission test", "Take the short English test at the campus."],
    ["02", "Fill in this form", "Add your score and a clear photo of the student."],
    ["03", "We confirm your batch", "The office contacts you on WhatsApp or email."],
];

export default async function AdmissionPage() {
    const options = await admissionFormOptions();

    return (
        <>
            <section className="relative overflow-hidden border-b border-line">
                <div className="mx-auto grid max-w-6xl items-end gap-10 px-4 pt-12 pb-14 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] md:pt-20">
                    <div className="animate-rise">
                        <p className="eyebrow text-gold-deep">
                            Admission · O Level English Language
                        </p>
                        <h1 className="mt-4 text-[clamp(2.6rem,6vw,4.6rem)] leading-[1.02] font-medium tracking-tight">
                            Take your seat in the{" "}
                            <em className="font-normal text-burgundy">next batch.</em>
                        </h1>
                        <span className="gold-rule mt-7" />
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                            Small batches, regular mock tests and personal feedback on every paper.
                            Apply below once you have taken the admission test.
                        </p>
                        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
                            {STEPS.map(([n, t, d]) => (
                                <li key={n} className="border-t border-line-strong pt-4">
                                    <span className="font-serif text-2xl text-burgundy">{n}</span>
                                    <span className="mt-1 block font-semibold">{t}</span>
                                    <span className="mt-1 block text-sm leading-relaxed text-muted">
                                        {d}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <figure className="relative mx-auto w-full max-w-sm md:mx-0 md:justify-self-end">
                        <div className="relative aspect-4/5 overflow-hidden rounded-t-[10rem] rounded-b-lg border border-line bg-paper-deep">
                            <Image
                                src="/tauhid.jpeg"
                                alt="Tauhid Mostafa"
                                fill
                                priority
                                sizes="(min-width: 768px) 24rem, 90vw"
                                className="object-cover object-top"
                            />
                        </div>
                        <figcaption className="absolute -bottom-5 left-4 right-4 rounded-md border border-line bg-surface px-4 py-3 shadow-[0_20px_40px_-24px_rgb(31_26_23/0.45)] sm:left-auto sm:right-auto">
                            <span className="block font-serif text-lg leading-tight">
                                Tauhid Mostafa
                            </span>
                            <span className="block text-xs text-muted">
                                MA in Applied Linguistics & ELT · 17+ years teaching
                            </span>
                        </figcaption>
                    </figure>
                </div>
            </section>

            <section className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
                {options.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line-strong bg-surface p-8 text-center">
                        <h2 className="text-2xl font-medium">Admissions open soon</h2>
                        <p className="mt-2 text-muted">
                            Please call the office for the next intake.
                        </p>
                    </div>
                ) : (
                    <AdmissionForm options={options} formToken={issueFormToken("admission")} />
                )}
            </section>
        </>
    );
}
