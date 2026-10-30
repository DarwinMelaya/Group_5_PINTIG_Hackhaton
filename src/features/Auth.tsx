import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Pencil, ShieldCheck, Waves, X } from "lucide-react";
import { backend, configured } from "../lib/supabase";
import { useStore } from "../lib/store";
import { Badge, PageTitle, Avatar, AuthPrompt } from "../components/common";
import { Button } from "../components/ui/button";
import { AVATAR_IDS, avatarUrl } from "../lib/avatars";
type Turnstile = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
function Captcha({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (!key) return;
    let id: string | undefined;
    let timer: ReturnType<typeof setInterval>;
    const render = () => {
      if (window.turnstile && ref.current && id === undefined)
        id = window.turnstile.render(ref.current, {
          sitekey: key,
          callback: onToken,
          "expired-callback": () => onToken(""),
        });
    };
    if (!document.getElementById("turnstile-script")) {
      const script = document.createElement("script");
      script.id = "turnstile-script";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      document.head.appendChild(script);
    }
    timer = setInterval(render, 200);
    return () => {
      clearInterval(timer);
      if (id) window.turnstile?.remove(id);
    };
  }, [onToken]);
  return import.meta.env.VITE_TURNSTILE_SITE_KEY ? <div ref={ref} /> : null;
}

const avatarChoices = AVATAR_IDS;
const spotChoices = [
  ["🏖️", "Beaches and Island Hopping"],
  ["🏔️", "Mountains and Hiking Trails"],
  ["🌊", "Waterfalls, Rivers, and Springs"],
  ["🏛️", "Historical Landmarks"],
  ["⛪", "Churches and Religious Heritage Sites"],
  ["🎭", "Cultural Festivals and Traditions"],
  ["🌿", "Eco-Tourism and Nature Parks"],
  ["🏕️", "Camping and Outdoor Adventures"],
  ["🤿", "Diving and Snorkeling"],
  ["🍽️", "Local Food and Culinary Destinations"],
  ["📸", "Scenic Viewpoints and Photography Spots"],
  ["🛍️", "Local Markets and Handicrafts"],
  ["🧘", "Wellness and Relaxation"],
  ["🏘️", "Community-Based Tourism"],
] as const;
const hobbyChoices = [
  "Photography",
  "Vlogging / Content Creation",
  "Hiking",
  "Swimming",
  "Cycling",
  "Camping",
  "Food Exploration",
  "Cultural Learning",
  "History",
  "Art and Crafts",
  "Wildlife and Nature",
  "Adventure Sports",
  "Traveling with Friends",
  "Solo Traveling",
  "Family Activities",
  "Volunteering",
  "Festival Attendance",
  "Relaxation",
];
const travelChoices = [
  "Solo Explorer",
  "Couple / Romantic Getaway",
  "Family Traveler",
  "Friends / Group Adventure",
  "Backpacker",
  "Cultural Explorer",
  "Nature Lover",
  "Luxury Traveler",
  "Budget Traveler",
];
const activityChoices = [
  "Island hopping",
  "Hiking",
  "Swimming",
  "Photography",
  "Cultural tours",
  "Food trips",
  "Camping",
  "Wellness",
];
type RegistrationData = {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthdate: string;
  gender: string;
  avatarType: "default" | "avatar" | "upload";
  avatarId: string;
  photo: File | null;
  photoUrl: string;
  spots: string[];
  hobbies: string[];
  otherInterests: string;
  travelStyles: string[];
  activities: string[];
  budget: string;
  terms: boolean;
  recommendations: boolean;
};
const initialRegistration: RegistrationData = {
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  middleName: "",
  lastName: "",
  birthdate: "",
  gender: "",
  avatarType: "default",
  avatarId: "dog",
  photo: null,
  photoUrl: "",
  spots: [],
  hobbies: [],
  otherInterests: "",
  travelStyles: [],
  activities: [],
  budget: "",
  terms: false,
  recommendations: false,
};
function getAge(value: string) {
  if (!value) return "";
  const birth = new Date(`${value}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()))
    age--;
  return age >= 0 ? String(age) : "";
}
const legalCopy = {
  terms: {
    title: "DALUYAN — Terms of Service",
    label: "Terms of Service",
    sections: [
      [
        "1. Acceptance of Terms",
        "By creating an account, you agree to use DALUYAN respectfully and in accordance with these terms. This document is a draft for project-owner and legal review before publication.",
      ],
      [
        "2. Eligibility and Registration",
        "You are responsible for providing accurate information and keeping your account credentials secure. Do not create an account for another person without permission.",
      ],
      [
        "3. Acceptable Use",
        "Do not harass, impersonate, defraud, scrape, disrupt, or upload unlawful, harmful, infringing, or misleading content. Community posts and reviews should describe genuine experiences.",
      ],
      [
        "4. Tourism Information",
        "Destination information is community and source-based and may change. Verify current schedules, access, safety conditions, prices, and local requirements before travelling.",
      ],
      [
        "5. User Content and Community",
        "You retain rights to content you submit and grant DALUYAN permission to display it in the service. We may moderate, remove, or restrict content that violates these terms or community safety.",
      ],
      [
        "6. Listings and Verification",
        "Listings may be submitted by businesses or community contributors. Verification labels describe the platform review state and are not a government endorsement.",
      ],
      [
        "7. Intellectual Property",
        "DALUYAN branding, software, and original materials are protected. Do not copy or commercially exploit them without permission.",
      ],
      [
        "8. Suspension and Changes",
        "Accounts or content may be restricted when needed for safety, abuse prevention, or legal compliance. We may change the service and will update this document when material changes are made.",
      ],
      [
        "9. Contact and Disputes",
        "For account, safety, or privacy questions, contact the project owner through the deployment's configured support channel. The project owner must review and publish the final contact and dispute-resolution details.",
      ],
    ],
  },
  privacy: {
    title: "DALUYAN — Privacy Policy",
    label: "Privacy Policy",
    sections: [
      [
        "Effective date and status",
        "Version 0.1 · Draft for project-owner review. This notice is designed around DALUYAN's current React and Supabase configuration and must be finalized with the appropriate privacy representative.",
      ],
      [
        "Information we collect",
        "DALUYAN may collect your username, name, birthdate, gender, email, optional phone number, profile photo or avatar choice, tourist interests, hobbies, travel styles, activities, and budget preference. Authentication is handled by Supabase Auth; passwords are not stored in profile tables.",
      ],
      [
        "How we use information",
        "We use account details to authenticate you, maintain your profile, operate social features, protect the service, and—only when you consent—to personalize destination and tourism recommendations using available destination records.",
      ],
      [
        "Visibility and storage",
        "Your public profile may show your username, display name, avatar, and published posts. Sensitive profile fields are intended to remain private by default. Uploaded photos are stored in the configured Supabase Storage bucket with authenticated ownership policies.",
      ],
      [
        "Location, retention, and rights",
        "The current registration flow does not request device location permission. Retention and deletion schedules depend on the project owner's Supabase configuration and must be confirmed before publication. You may request access, correction, consent withdrawal, or deletion through the configured support channel.",
      ],
      [
        "Philippine privacy framework",
        "This draft is intended to be reviewed against the Data Privacy Act of 2012 (Republic Act No. 10173) and applicable National Privacy Commission guidance. It does not make security-certification or legal-compliance guarantees.",
      ],
    ],
  },
} as const;
function LegalDocument({
  kind,
  onClose,
}: {
  kind: "terms" | "privacy";
  onClose: () => void;
}) {
  const document = legalCopy[kind];
  return (
    <div
      className="legal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="legal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
      >
        <div className="between row">
          <div>
            <span className="eyebrow">DALUYAN · VERSION 0.1 DRAFT</span>
            <h2 id="legal-title">{document.title}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close document"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="legal-scroll">
          {document.sections.map(([heading, body]) => (
            <section key={heading}>
              <h3>{heading}</h3>
              <p>{body}</p>
            </section>
          ))}
        </div>
        <Button type="button" onClick={onClose}>
          Close
        </Button>
      </section>
    </div>
  );
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="review-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
function ReviewList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="review-list">
      <span>{label}</span>
      {values.length ? (
        <div className="review-chips">
          {values.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
      ) : (
        <b>Not specified — You can add interests later.</b>
      )}
    </div>
  );
}
function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="review-section">
      <div className="between row">
        <h3>{title}</h3>
        <button
          type="button"
          className="icon-button"
          aria-label={`Edit ${title}`}
          onClick={onEdit}
        >
          <Pencil size={15} />
        </button>
      </div>
      {children}
    </section>
  );
}
function RegisterWizard({
  onDone,
  onSwitch,
}: {
  onDone: (message: string) => void;
  onSwitch: () => void;
}) {
  const [data, setData] = useState(initialRegistration);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [legalDocument, setLegalDocument] = useState<
    "terms" | "privacy" | null
  >(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [usernameState, setUsernameState] = useState("");
  const update = <K extends keyof RegistrationData>(
    key: K,
    value: RegistrationData[K],
  ) => setData((old) => ({ ...old, [key]: value }));
  useEffect(() => {
    if (!configured) {
      setUsernameState("");
      return;
    }
    const username = data.username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9._]{3,25}$/.test(username)) {
      setUsernameState("");
      return;
    }
    const timer = window.setTimeout(() => {
      void backend()
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("username", username)
        .then(({ count, error: queryError }) =>
          setUsernameState(queryError ? "" : count ? "taken" : "available"),
        );
    }, 350);
    return () => window.clearTimeout(timer);
  }, [data.username]);
  function validateCurrent() {
    if (step === 1) {
      if (!/^[a-zA-Z0-9._]{3,25}$/.test(data.username))
        return "Username must be 3–25 characters using letters, numbers, underscores, or periods.";
      if (usernameState === "taken") return "That username is already in use.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        return "Enter a valid email address.";
      if (
        data.phone &&
        !/^\+[1-9]\d{6,14}$/.test(data.phone.replace(/[\s()-]/g, ""))
      )
        return "Use an international phone format such as +639171234567.";
      if (data.password.length < 8)
        return "Use at least 8 characters for your password.";
      if (data.password !== data.confirmPassword)
        return "Passwords do not match.";
    }
    if (step === 2) {
      if (!data.firstName.trim() || !data.lastName.trim())
        return "Enter your first and last name.";
      if (
        !data.birthdate ||
        new Date(`${data.birthdate}T00:00:00`) > new Date()
      )
        return "Choose a valid birthdate that is not in the future.";
    }
    if (step === 3 && data.spots.length < 3)
      return "Choose at least three tourist spots, or use Skip for now.";
    return "";
  }
  async function createAccount() {
    setBusy(true);
    setError("");
    try {
      const fullName = [data.firstName, data.middleName, data.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const { data: result, error: signUpError } = await backend().auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            username: data.username.trim().toLowerCase(),
            display_name: fullName,
            full_name: fullName,
            first_name: data.firstName,
            middle_name: data.middleName,
            last_name: data.lastName,
            birthdate: data.birthdate,
            gender: data.gender || null,
            phone_number: data.phone
              ? data.phone.replace(/[\s()-]/g, "")
              : null,
            avatar_type: data.avatarType,
            avatar_id: data.avatarId,
            travel_styles: data.travelStyles,
            spots: data.spots,
            hobbies: [
              ...data.hobbies,
              ...(data.otherInterests ? [data.otherInterests] : []),
            ],
            activities: data.activities,
            budget: data.budget,
            recommendations: data.recommendations,
            terms_version: "0.1-draft",
            privacy_version: "0.1-draft",
            terms_accepted: true,
          },
          emailRedirectTo: location.origin + "/auth",
          captchaToken: captchaToken || undefined,
        },
      });
      if (signUpError) throw signUpError;
      if (result.session && result.user && data.photo) {
        const path = `${result.user.id}/${crypto.randomUUID()}.${data.photo.name.split(".").pop()}`;
        const { error: uploadError } = await backend()
          .storage.from("avatars")
          .upload(path, data.photo, {
            upsert: true,
            contentType: data.photo.type,
          });
        if (uploadError) throw uploadError;
        const avatar_url = backend().storage.from("avatars").getPublicUrl(path).data.publicUrl;
        await backend()
          .from("profiles")
          .update({ avatar_type: "upload", avatar_storage_path: path, avatar_url })
          .eq("id", result.user.id);
      }
      onDone(
        result.session
          ? "Your account is ready. Welcome to DALUYAN!"
          : "Registration succeeded, but no session was returned. Turn off Confirm email in Supabase Auth to enable automatic login.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "We could not create your account.",
      );
    } finally {
      setBusy(false);
    }
  }
  const maxDate = new Date().toISOString().slice(0, 10);
  const age = getAge(data.birthdate);
  return (
    <div className="registration-wizard">
      <div className="wizard-progress">
        <span>STEP {step} OF 4</span>
        <div>
          <i style={{ width: `${step * 25}%` }} />
        </div>
      </div>
      {step === 1 && (
        <div className="form-stack">
          <p className="wizard-kicker">ACCOUNT DETAILS</p>
          <label>
            Username
            <input
              required
              value={data.username}
              onChange={(e) => update("username", e.target.value)}
              autoComplete="username"
              placeholder="your.island.name"
            />
            {usernameState && (
              <small
                className={
                  usernameState === "available" ? "success-text" : "form-error"
                }
              >
                {usernameState === "available"
                  ? "Username available"
                  : "Username already taken"}
              </small>
            )}
          </label>
          <label>
            Email address
            <input
              type="email"
              required
              value={data.email}
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Phone number <span className="muted">(optional)</span>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+639171234567"
              autoComplete="tel"
            />
            <small>International country codes are supported.</small>
          </label>
          <div className="wizard-grid">
            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={data.password}
                  onChange={(e) => update("password", e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <small>
                Password strength:{" "}
                {data.password.length >= 12
                  ? "strong"
                  : data.password.length >= 8
                    ? "good"
                    : "use 8+ characters"}
              </small>
            </label>
            <label>
              Confirm password
              <div className="password-field">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={data.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
              {data.confirmPassword && (
                <small
                  className={
                    data.password === data.confirmPassword
                      ? "success-text"
                      : "form-error"
                  }
                >
                  {data.password === data.confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </small>
              )}
            </label>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="form-stack">
          <p className="wizard-kicker">PERSONAL PROFILE</p>
          <div className="wizard-grid">
            <label>
              First name
              <input
                required
                value={data.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                autoComplete="given-name"
              />
            </label>
            <label>
              Middle name <span className="muted">(optional)</span>
              <input
                value={data.middleName}
                onChange={(e) => update("middleName", e.target.value)}
              />
            </label>
          </div>
          <label>
            Last name
            <input
              required
              value={data.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              autoComplete="family-name"
            />
          </label>
          <div className="wizard-grid">
            <label>
              Birthdate
              <input
                type="date"
                required
                max={maxDate}
                value={data.birthdate}
                onChange={(e) => update("birthdate", e.target.value)}
              />
            </label>
            <label>
              Age
              <input
                readOnly
                value={age ? `${age} years old` : "Calculated from birthdate"}
              />
            </label>
          </div>
          <label>
            Gender <span className="muted">(optional)</span>
            <select
              value={data.gender}
              onChange={(e) => update("gender", e.target.value)}
            >
              <option value="">Prefer not to say</option>
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Prefer to self-describe</option>
            </select>
          </label>
          <fieldset>
            <legend>Choose Your Profile Picture</legend>
            <div className="avatar-picker-heading">
              <span className="muted">Choose an illustrated companion</span>
              <span className="avatar-selection-preview">
                {data.avatarType === "upload" && data.photoUrl ? <img src={data.photoUrl} alt="Selected profile preview" /> : <img src={avatarUrl(data.avatarId) ?? ""} alt="Selected illustrated avatar" />}
              </span>
            </div>
            <div className="avatar-choice-row">
              {avatarChoices.map((avatar) => (
                <button
                  type="button"
                  key={avatar}
                  className={
                    data.avatarType === "avatar" && data.avatarId === avatar
                      ? "avatar-option selected"
                      : "avatar-option"
                  }
                  onClick={() => {
                    update("avatarType", "avatar");
                    update("avatarId", avatar);
                  }}
                >
                  <span className="illustrated-avatar">
                    <img src={avatarUrl(avatar) ?? ""} alt="" />
                    {data.avatarType === "avatar" && data.avatarId === avatar && <span className="avatar-check">✓</span>}
                  </span>
                </button>
              ))}
            </div>
            <label className="upload-option">
              Upload JPG, PNG or WebP (max 5 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    setError("Profile photos must be 5 MB or smaller.");
                    return;
                  }
                  update("photo", file);
                  update("avatarType", "upload");
                  update("photoUrl", URL.createObjectURL(file));
                }}
              />
            </label>
            {data.photoUrl && (
              <img
                className="photo-preview"
                src={data.photoUrl}
                alt="Profile preview"
              />
            )}
          </fieldset>
        </div>
      )}
      {step === 3 && (
        <div className="form-stack">
          <p className="wizard-kicker">DISCOVER YOUR ISLAND PERSONALITY</p>
          <p className="muted">
            Tell us what you love, and DALUYAN will help you discover the best
            experiences in Marinduque.
          </p>
          <fieldset>
            <legend>What would you like to explore?</legend>
            <div className="interest-grid">
              {spotChoices.map(([icon, label]) => (
                <label className="interest-card" key={label}>
                  <input
                    type="checkbox"
                    checked={data.spots.includes(label)}
                    onChange={(e) =>
                      update(
                        "spots",
                        e.target.checked
                          ? [...data.spots, label]
                          : data.spots.filter((x) => x !== label),
                      )
                    }
                  />
                  <span>{icon}</span>
                  <b>{label}</b>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Hobbies and interests</legend>
            <div className="chip-grid">
              {hobbyChoices.map((hobby) => (
                <label className="check-chip" key={hobby}>
                  <input
                    type="checkbox"
                    checked={data.hobbies.includes(hobby)}
                    onChange={(e) =>
                      update(
                        "hobbies",
                        e.target.checked
                          ? [...data.hobbies, hobby]
                          : data.hobbies.filter((x) => x !== hobby),
                      )
                    }
                  />
                  {hobby}
                </label>
              ))}
            </div>
            <input
              placeholder="Other interests (optional)"
              value={data.otherInterests}
              onChange={(e) => update("otherInterests", e.target.value)}
            />
          </fieldset>
          <fieldset>
            <legend>Preferred travel style</legend>
            <div className="chip-grid">
              {travelChoices.map((style) => (
                <label className="check-chip" key={style}>
                  <input
                    type="checkbox"
                    checked={data.travelStyles.includes(style)}
                    onChange={(e) =>
                      update(
                        "travelStyles",
                        e.target.checked
                          ? [...data.travelStyles, style]
                          : data.travelStyles.filter((x) => x !== style),
                      )
                    }
                  />
                  {style}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Preferred activities</legend>
            <div className="chip-grid">
              {activityChoices.map((activity) => (
                <label className="check-chip" key={activity}>
                  <input
                    type="checkbox"
                    checked={data.activities.includes(activity)}
                    onChange={(e) =>
                      update(
                        "activities",
                        e.target.checked
                          ? [...data.activities, activity]
                          : data.activities.filter((x) => x !== activity),
                      )
                    }
                  />
                  {activity}
                </label>
              ))}
            </div>
            <label>
              Approximate travel budget{" "}
              <span className="muted">(optional)</span>
              <select
                value={data.budget}
                onChange={(e) => update("budget", e.target.value)}
              >
                <option value="">Not specified</option>
                <option>₱500–₱1,000</option>
                <option>₱1,001–₱2,500</option>
                <option>₱2,501–₱5,000</option>
                <option>₱5,000+</option>
              </select>
            </label>
          </fieldset>
        </div>
      )}
      {step === 4 && (
        <div className="form-stack">
          <p className="wizard-kicker">REVIEW & CREATE ACCOUNT</p>
          <div className="review-card">
            <div className="initial-avatar large review-avatar-preview">
              {data.avatarType === "upload" && data.photoUrl ? <img src={data.photoUrl} alt="Selected profile preview" /> : <img src={avatarUrl(data.avatarId) ?? ""} alt="Selected illustrated avatar" />}
            </div>
            <div>
              <h3>
                {data.firstName} {data.lastName}
              </h3>
              <p className="muted">
                @{data.username} · {data.email}
              </p>
            </div>
          </div>
          <div className="review-details">
          <ReviewSection title="Account Information" onEdit={() => setStep(1)}>
            <div className="review-photo-row">
              <span>Profile picture</span>
              {data.avatarType === "upload" && data.photoUrl ? <img src={data.photoUrl} alt="Selected profile preview" /> : <img src={avatarUrl(data.avatarId) ?? ""} alt="Selected illustrated avatar" />}
            </div>
            <ReviewRow label="Username" value={`@${data.username}`} />
            <ReviewRow label="Email address" value={data.email} />
            <ReviewRow
              label="Phone number"
              value={data.phone || "Not provided"}
            />
            <ReviewRow
              label="Password status"
              value="Password created securely"
            />
            <ReviewRow
              label="Email verification"
              value="Verification email will be sent after account creation"
            />
          </ReviewSection>
          <ReviewSection title="Personal Information" onEdit={() => setStep(2)}>
            <ReviewRow
              label="Full name"
              value={[data.firstName, data.middleName, data.lastName]
                .filter(Boolean)
                .join(" ")}
            />
            <ReviewRow
              label="Birthdate"
              value={
                data.birthdate
                  ? new Date(`${data.birthdate}T00:00:00`).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "long", day: "numeric" },
                    )
                  : "Not provided"
              }
            />
            <ReviewRow
              label="Age"
              value={age ? `${age} years old` : "Not calculated"}
            />
            <ReviewRow
              label="Gender"
              value={data.gender || "Prefer not to say"}
            />
          </ReviewSection>
          <ReviewSection title="Tourist Preferences" onEdit={() => setStep(3)}>
            <ReviewList label="Desired tourist spots" values={data.spots} />
            <ReviewList
              label="Hobbies and interests"
              values={[
                ...data.hobbies,
                ...(data.otherInterests ? [data.otherInterests] : []),
              ]}
            />
            <ReviewList
              label="Preferred travel style"
              values={data.travelStyles}
            />
            <ReviewList label="Preferred activities" values={data.activities} />
            <ReviewRow
              label="Travel budget"
              value={data.budget || "Not specified"}
            />
          </ReviewSection>
          </div>
          <section className="review-section consent-section">
            <h3>Before You Create Your Account</h3>
            <p className="muted">
              Please review the following documents to understand your rights,
              responsibilities, and how DALUYAN handles your personal
              information.
            </p>
            <div className="legal-links">
              <button
                type="button"
                className="text-link"
                onClick={() => setLegalDocument("terms")}
              >
                Read Terms of Service
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() => setLegalDocument("privacy")}
              >
                Read Privacy Policy
              </button>
            </div>
          </section>
          <label className="consent">
            <input
              type="checkbox"
              checked={data.terms}
              onChange={(e) => update("terms", e.target.checked)}
            />{" "}
            I agree to the Terms of Service and Privacy Policy.
          </label>
          <label className="consent">
            <input
              type="checkbox"
              checked={data.recommendations}
              onChange={(e) => update("recommendations", e.target.checked)}
            />{" "}
            Use my preferences for personalized recommendations.{" "}
            <span className="muted">(optional)</span>
          </label>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Captcha onToken={setCaptchaToken} />
      <div className="wizard-actions">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError("");
              setStep(step - 1);
            }}
          >
            Back
          </Button>
        )}
        {step < 4 ? (
          <>
            {step === 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError("");
                  setStep(4);
                }}
              >
                Skip for now
              </Button>
            )}
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                const issue = validateCurrent();
                if (issue) {
                  setError(issue);
                  return;
                }
                setError("");
                setStep(step + 1);
              }}
            >
              Next
            </Button>
          </>
        ) : (
          <Button
            type="button"
            disabled={
              busy ||
              !data.terms ||
              (!!import.meta.env.VITE_TURNSTILE_SITE_KEY && !captchaToken)
            }
            onClick={createAccount}
          >
            {busy ? "Creating account…" : "Create account"}
          </Button>
        )}
      </div>
      <p className="auth-switch">
        Already have an account?{" "}
        <button className="text-link" type="button" onClick={onSwitch}>
          Sign in
        </button>
      </p>
      {legalDocument && (
        <LegalDocument
          kind={legalDocument}
          onClose={() => setLegalDocument(null)}
        />
      )}
    </div>
  );
}
export function Auth() {
  const s = useStore();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") ?? "login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [factor, setFactor] = useState("");
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState("");
  const isRegister = mode === "register";

  function normalizePhone(value: string) {
    return value.trim().replace(/[\s()-]/g, "");
  }

  function validateCredentials() {
    const identifier = email.trim();
    if (mode !== "recovery" && !identifier)
      return "Enter your email or phone number.";
    if (
      mode !== "recovery" &&
      identifier.includes("@") &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    )
      return "Enter a valid email address.";
    if (
      mode !== "recovery" &&
      !identifier.includes("@") &&
      !/^\+?[1-9]\d{6,14}$/.test(normalizePhone(identifier))
    )
      return "Enter a valid phone number with country code, such as +639171234567.";
    if (isRegister && !/^\+?[1-9]\d{6,14}$/.test(normalizePhone(phone)))
      return "Enter a valid phone number with country code, such as +639171234567.";
    if (isRegister && password.length < 12)
      return "Use a password with at least 12 characters.";
    return "";
  }
  useEffect(() => {
    if (s.session && configured)
      void backend()
        .auth.mfa.listFactors()
        .then(({ data }) =>
          setFactor(data?.totp.find((f) => f.status === "verified")?.id ?? ""),
        );
  }, [s.session]);
  const needsMfa = !!s.session && !!factor && s.aal !== "aal2";
  return (
    <div className="auth-page">
      <section className="auth-art">
        <Waves size={38} />
        <span className="eyebrow">WELCOME TO DALUYAN</span>
        <h1>
          Every journey
          <br />
          begins with
          <br />
          <em>a connection.</em>
        </h1>
        <p>
          Explore Marinduque. Share Your Journey.
          <br />
          Shape Better Tourism.
        </p>
        <img src="/landscape-3.svg" alt="Original island illustration" />
      </section>
      <section className="card auth-form">
        <Badge>YOUR ISLAND COMMUNITY</Badge>
        <h1>
          {needsMfa
            ? "Verify your second factor"
            : mode === "register"
              ? "Join the journey"
              : mode === "reset"
                ? "Reset your password"
                : mode === "recovery"
                  ? "Choose a new password"
                  : "Welcome back."}
        </h1>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {s.session && !needsMfa && mode !== "recovery" ? (
          <>
            <p>You are signed in{s.aal === "aal2" ? " with MFA" : ""}.</p>
            <Button asChild>
              <Link to="/">Continue to HOME</Link>
            </Button>
          </>
        ) : needsMfa ? (
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              void s
                .run(async () => {
                  const { error } = await backend().auth.mfa.challengeAndVerify(
                    { factorId: factor, code },
                  );
                  if (error) throw error;
                  setCode("");
                }, "Second factor verified")
                .finally(() => setBusy(false));
            }}
          >
            <label>
              Authenticator code
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <Button disabled={busy}>Verify secure login</Button>
            <p className="fine-print">
              Lost your authenticator? Contact the trusted project administrator
              for identity-verified recovery. Email verification does not bypass
              MFA.
            </p>
          </form>
        ) : isRegister ? (
          <RegisterWizard
            onDone={setMessage}
            onSwitch={() => setMode("login")}
          />
        ) : (
          <>
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                setBusy(true);
                setMessage("");
                setFieldError("");
                const validationError = validateCredentials();
                if (validationError) {
                  setFieldError(validationError);
                  setBusy(false);
                  return;
                }
                void s
                  .run(async () => {
                    const client = backend();
                    const captchaToken = token || undefined;
                    if (mode === "register") {
                      const { data: authData, error } = await client.auth.signUp({
                        email,
                        password,
                        options: {
                          data: {
                            display_name: name.trim(),
                            phone_number: normalizePhone(phone),
                          },
                          emailRedirectTo: location.origin + "/auth",
                          captchaToken,
                        },
                      });
                      if (error) throw error;
                      setMessage(
                        authData.session
                          ? "Your account is ready. Welcome to DALUYAN!"
                          : "Registration succeeded. Disable Confirm email in Supabase Auth settings to sign in automatically.",
                      );
                    } else if (mode === "reset") {
                      const { error } = await client.auth.resetPasswordForEmail(
                        email,
                        {
                          redirectTo: location.origin + "/auth?mode=recovery",
                          captchaToken,
                        },
                      );
                      if (error) throw error;
                      setMessage(
                        "If this address is registered, a recovery link will be sent.",
                      );
                    } else if (mode === "recovery") {
                      const { error } = await client.auth.updateUser({
                        password,
                      });
                      if (error) throw error;
                      setMessage("Password updated.");
                    } else {
                      const identifier = email.trim();
                      const credentials = identifier.includes("@")
                        ? { email: identifier }
                        : { phone: normalizePhone(identifier) };
                      const { error } = await client.auth.signInWithPassword({
                        ...credentials,
                        password,
                        options: { captchaToken },
                      });
                      if (error) throw error;
                    }
                    setPassword("");
                  }, "Authentication request completed")
                  .then((ok) => {
                    if (!ok)
                      setFieldError(
                        "We could not complete that request. Check your details and try again.",
                      );
                  })
                  .finally(() => setBusy(false));
              }}
            >
              {mode === "register" && (
                <label>
                  Display name
                  <input
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="nickname"
                  />
                </label>
              )}
              {mode !== "recovery" && (
                <label>
                  {mode === "login" ? "Email or phone number" : "Email address"}
                  <input
                    type={mode === "login" ? "text" : "email"}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete={mode === "login" ? "username" : "email"}
                    placeholder={
                      mode === "login"
                        ? "you@example.com or +639..."
                        : undefined
                    }
                  />
                </label>
              )}
              {isRegister && (
                <label>
                  Phone number
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+639171234567"
                    inputMode="tel"
                  />
                  <small>
                    Include your country code. This is saved securely with your
                    account profile.
                  </small>
                </label>
              )}
              {mode !== "reset" && (
                <label>
                  Password
                  <input
                    type="password"
                    minLength={mode === "login" ? 1 : 12}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </label>
              )}
              <Captcha onToken={setToken} />
              {fieldError && (
                <p className="form-error" role="alert">
                  {fieldError}
                </p>
              )}
              <Button
                disabled={
                  busy ||
                  (!!import.meta.env.VITE_TURNSTILE_SITE_KEY && !token)
                }
              >
                {busy
                  ? "Please wait…"
                  : mode === "register"
                    ? "Create account"
                    : mode === "reset"
                      ? "Send recovery link"
                      : mode === "recovery"
                        ? "Update password"
                        : "Sign in"}
              </Button>
            </form>
            {mode === "login" && (
              <>
                <button className="text-link" onClick={() => setMode("reset")}>
                  Forgot your password?
                </button>
                <div className="auth-divider">or continue with</div>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void s.run(async () => {
                      const { error } = await backend().auth.signInWithOAuth({
                        provider: "google",
                        options: { redirectTo: location.origin + "/auth" },
                      });
                      if (error) throw error;
                    }, "Redirecting to Google")
                  }
                >
                  Google
                </Button>
              </>
            )}
            <p>
              {mode === "login"
                ? "New to the island community?"
                : "Already have an account?"}{" "}
              <button
                className="text-link"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setMessage("");
                }}
              >
                {mode === "login" ? "Register" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
export function Settings() {
  const s = useStore();
  const [displayName, setDisplayName] = useState(s.profile?.display_name ?? "");
  const [password, setPassword] = useState("");
  const [factor, setFactor] = useState<{ id: string; qr: string } | null>(null);
  const [verified, setVerified] = useState<
    { id: string; friendly_name?: string }[]
  >([]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setDisplayName(s.profile?.display_name ?? "");
    if (s.session)
      void backend()
        .auth.mfa.listFactors()
        .then(({ data }) =>
          setVerified(data?.totp.filter((f) => f.status === "verified") ?? []),
        );
  }, [s.profile, s.session]);
  if (!s.session)
    return (
      <div className="page">
        <PageTitle
          eyebrow="SETTINGS"
          title="Your account, your choices."
          description="Profiles are public. Saved places, itineraries, feedback evidence and personal notifications are private."
        />
        <AuthPrompt />
      </div>
    );
  return (
    <div className="page settings-page">
      <PageTitle
        eyebrow="SETTINGS"
        title="Make yourself at home."
        description="Manage your profile, privacy and account security."
      />
      <section className="card form-stack">
        <h2>Public profile</h2>
        <div className="row">
          <Avatar name={s.profile?.display_name} url={s.profile?.avatar_url} avatarType={s.profile?.avatar_type} avatarId={s.profile?.avatar_id} />
          <label>
            Upload profile picture
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  void s.run(async () => {
                    const avatar_url = await s.upload(file, "avatars");
                    const { error } = await backend()
                      .from("profiles")
                      .update({ avatar_url, avatar_type: "upload", avatar_id: null, avatar_storage_path: null })
                      .eq("id", s.requireUser());
                    if (error) throw error;
                  }, "Avatar updated");
              }}
            />
          </label>
        </div>
        <div className="settings-avatar-picker">
          <span className="muted">Or choose an illustrated avatar</span>
          <div className="avatar-choice-row">
            {AVATAR_IDS.map((avatar) => (
              <button
                key={avatar}
                type="button"
                className={s.profile?.avatar_type === "avatar" && s.profile.avatar_id === avatar ? "avatar-option selected" : "avatar-option"}
                aria-label="Choose illustrated avatar"
                onClick={() => void s.run(async () => {
                  const { error } = await backend().from("profiles").update({ avatar_type: "avatar", avatar_id: avatar, avatar_url: null, avatar_storage_path: null }).eq("id", s.requireUser());
                  if (error) throw error;
                }, "Avatar updated")}
              >
                <span className="illustrated-avatar">
                  <img src={avatarUrl(avatar) ?? ""} alt="" />
                  {s.profile?.avatar_type === "avatar" && s.profile.avatar_id === avatar && <span className="avatar-check">✓</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void s.run(async () => {
              const { error } = await backend()
                .from("profiles")
                .update({ display_name: displayName })
                .eq("id", s.requireUser());
              if (error) throw error;
            }, "Profile updated");
          }}
        >
          <label>
            Display name
            <input
              required
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <Button>Save profile</Button>
        </form>
      </section>
      <section className="card form-stack">
        <h2>Your interests & privacy</h2>
        <fieldset>
          <legend>Personalize your feed on this browser</legend>
          <div className="filter-chips">
            {[
              "beach",
              "nature",
              "heritage",
              "culture",
              "hiking",
              "photography",
            ].map((interest) => (
              <label className="check-chip" key={interest}>
                <input
                  type="checkbox"
                  checked={s.interests.includes(interest)}
                  onChange={(e) =>
                    s.setInterests(
                      e.target.checked
                        ? [...s.interests, interest]
                        : s.interests.filter((i) => i !== interest),
                    )
                  }
                />
                {interest}
              </label>
            ))}
          </div>
        </fieldset>
        <p>
          Your display name, avatar and published posts are public. Feedback
          reports/evidence, notifications, saved places and itineraries are
          private under database policies. Do not include sensitive details in
          public posts.
        </p>
        <Button
          variant="outline"
          onClick={() =>
            void s.run(async () => {
              const { error } = await backend()
                .from("profiles")
                .update({ avatar_url: null, avatar_type: "default", avatar_id: null, avatar_storage_path: null, display_name: "Traveler" })
                .eq("id", s.requireUser());
              if (error) throw error;
            }, "Public identity minimized")
          }
        >
          Remove avatar and minimize public name
        </Button>
        <p>
          Delete owned posts from HOME. Request account erasure through your
          deployment’s data controller; self-service account deletion is not yet
          implemented.
        </p>
      </section>
      <section className="card form-stack">
        <div className="row">
          <ShieldCheck />
          <h2>Authenticator security</h2>
        </div>
        <p>
          Current assurance: <Badge>{s.aal.toUpperCase()}</Badge>.{" "}
          {verified.length} verified TOTP factor(s). Sensitive administration
          requires AAL2.
        </p>
        {!factor && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void s
                .run(async () => {
                  const { data, error } = await backend().auth.mfa.enroll({
                    factorType: "totp",
                    friendlyName: "DALUYAN authenticator",
                  });
                  if (error) throw error;
                  setFactor({ id: data.id, qr: data.totp.qr_code });
                }, "Scan the QR code with your authenticator")
                .finally(() => setBusy(false));
            }}
          >
            Start MFA enrollment
          </Button>
        )}
        {factor && (
          <div className="mfa-enrollment">
            <p>
              Scan this private QR code in your authenticator. Do not share it.
            </p>
            <img
              className="mfa-qr"
              src={
                factor.qr.startsWith("data:")
                  ? factor.qr
                  : "data:image/svg+xml;charset=utf-8," +
                    encodeURIComponent(factor.qr)
              }
              alt="Private authenticator enrollment QR code"
            />
          </div>
        )}
        {(factor || verified.length > 0) && (
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              void s
                .run(async () => {
                  const { error } = await backend().auth.mfa.challengeAndVerify(
                    { factorId: factor?.id ?? verified[0].id, code },
                  );
                  if (error) throw error;
                  setFactor(null);
                  setCode("");
                  const { data } = await backend().auth.mfa.listFactors();
                  setVerified(
                    data?.totp.filter((f) => f.status === "verified") ?? [],
                  );
                }, "Authenticator verified")
                .finally(() => setBusy(false));
            }}
          >
            <label>
              Six-digit authenticator code
              <input
                pattern="[0-9]{6}"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </label>
            <Button disabled={busy}>Verify authenticator</Button>
          </form>
        )}
        {factor && (
          <Button
            variant="ghost"
            onClick={() =>
              void s.run(async () => {
                const { error } = await backend().auth.mfa.unenroll({
                  factorId: factor.id,
                });
                if (error) throw error;
                setFactor(null);
              }, "Enrollment cancelled")
            }
          >
            Cancel enrollment
          </Button>
        )}
        {s.aal === "aal2" &&
          verified.map((f) => (
            <Button
              variant="outline"
              key={f.id}
              onClick={() =>
                void s.run(async () => {
                  const { error } = await backend().auth.mfa.unenroll({
                    factorId: f.id,
                  });
                  if (error) throw error;
                  setVerified((old) => old.filter((x) => x.id !== f.id));
                }, "Factor removed")
              }
            >
              Remove {f.friendly_name ?? "authenticator"}
            </Button>
          ))}
        <small>
          Recovery: contact your trusted deployment administrator for identity
          verification and secure factor reset. No custom recovery bypass is
          provided.
        </small>
      </section>
      <section className="card form-stack">
        <h2>Password & session</h2>
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void s.run(async () => {
              const { error } = await backend().auth.updateUser({ password });
              if (error) throw error;
              setPassword("");
            }, "Password updated");
          }}
        >
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button variant="outline">Change password</Button>
        </form>
        <Button
          variant="destructive"
          onClick={() =>
            void s.run(async () => {
              const { error } = await backend().auth.signOut({
                scope: "global",
              });
              if (error) throw error;
            }, "Signed out from all sessions")
          }
        >
          Log out of all sessions
        </Button>
      </section>
    </div>
  );
}
