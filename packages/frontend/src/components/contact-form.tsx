import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Input } from "@base-ui/react/input";
import { type SubmitEvent, useState } from "react";

type Submission = { status: "idle" | "pending" | "success" } | { status: "error"; message: string };

export function ContactForm({ endpoint, email }: { endpoint?: string; email: string }) {
  const [submission, setSubmission] = useState<Submission>({ status: "idle" });

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    if (values.get("_gotcha")) return;
    if (!endpoint) {
      const subject = `Portfolio enquiry from ${values.get("name")}`;
      const body = `${values.get("message")}\n\nFrom: ${values.get("name")}\nReply to: ${values.get("email")}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }
    setSubmission({ status: "pending" });
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: values,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        setSubmission({
          status: "error",
          message: `Your message could not be sent. Please try again or email ${email} directly.`,
        });
        return;
      }
      setSubmission({ status: "success" });
      form.reset();
    } catch {
      setSubmission({
        status: "error",
        message: "Could not connect. Please check your connection and try again.",
      });
    }
  }

  return (
    <Form onSubmit={submit} className="contact-form" validationMode="onSubmit">
      <Field.Root name="email">
        <Field.Label>Email</Field.Label>
        <Input
          type="email"
          placeholder="Your email"
          required
          autoComplete="email"
          maxLength={254}
        />
        <Field.Error className="field-error" />
      </Field.Root>
      <Field.Root name="name">
        <Field.Label>Name</Field.Label>
        <Input placeholder="Your name" required autoComplete="name" maxLength={100} />
        <Field.Error className="field-error" />
      </Field.Root>
      <Field.Root name="message">
        <Field.Label>Message</Field.Label>
        <Field.Control
          render={<textarea rows={7} />}
          placeholder="Write your message here..."
          required
          maxLength={10000}
        />
        <Field.Error className="field-error" />
      </Field.Root>
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <Button
        type="submit"
        className="pill-button"
        disabled={submission.status === "pending"}
        focusableWhenDisabled
      >
        {submission.status === "pending"
          ? "Sending…"
          : endpoint
            ? "Send email"
            : "Open email draft"}
      </Button>
      {!endpoint && (
        <p className="form-note">
          Opens your email app. You can also <a href={`mailto:${email}`}>email me directly</a>.
        </p>
      )}
      <div role="status" aria-live="polite">
        {submission.status === "success" && <p>Thank you! Your message has been sent.</p>}
        {submission.status === "error" && <p className="field-error">{submission.message}</p>}
      </div>
      <noscript>
        <p>
          Please <a href={`mailto:${email}`}>email me directly</a>.
        </p>
      </noscript>
    </Form>
  );
}
