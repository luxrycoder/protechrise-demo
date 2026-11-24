"use client";

import { useMemo } from "react";
import { Combobox, type ComboOption } from "@/features/application/combobox";
import { FieldShell, SelectField, TextField, fieldAria } from "@/features/application/field-controls";
import { COUNTRY_NAMES, citiesFor, flagFor, phoneCodeOptions } from "@/features/application/geo";
import type { StepProps } from "@/features/application/steps/step-types";
import styles from "@/features/application/application.module.css";

const COUNTRY_OPTIONS: readonly ComboOption[] = COUNTRY_NAMES.map((name) => ({ key: name, label: name, flag: flagFor(name) }));

const OTHER_CITY = "Other";

/** Step 1: contact details, country, phone and (unless `withCity` is off, as on the apply-and-pay form) city. */
export function StepAbout({ values, errors, onChange, onBlur, withCity = true }: StepProps & { readonly withCity?: boolean }) {
  const codes = useMemo(() => phoneCodeOptions().map((o) => ({ key: o.key, label: o.label, flag: o.flag, value: o.value })), []);
  // Several countries share a calling code (+1), so prefer the selected country's own option.
  const selectedCode = codes.find((o) => o.value === values.phoneCode && o.key === values.country) ?? codes.find((o) => o.value === values.phoneCode);
  const cities = citiesFor(values.country);
  const phoneAria = fieldAria("phone", errors.phone, false);

  return (
    <>
      <p className={styles.groupLabel}>Contact</p>
      <div className={styles.grid}>
        <TextField id="firstName" label="First name" value={values.firstName} maxLength={60} autoComplete="given-name" error={errors.firstName} onChange={(v) => onChange("firstName", v)} onBlur={() => onBlur("firstName")} />
        <TextField id="lastName" label="Last name" value={values.lastName} maxLength={60} autoComplete="family-name" error={errors.lastName} onChange={(v) => onChange("lastName", v)} onBlur={() => onBlur("lastName")} />
        <TextField
          id="email"
          type="email"
          label="Email address"
          value={values.email}
          maxLength={254}
          autoComplete="email"
          error={errors.email}
          hint="Enter a valid, active email address. We'll send your application status and next steps here."
          full
          onChange={(v) => onChange("email", v)}
          onBlur={() => onBlur("email")}
        />

        <FieldShell id="country" error={errors.country}>
          <Combobox
            id="country"
            label="Country"
            options={COUNTRY_OPTIONS}
            selectedKey={values.country}
            placeholder="Search country..."
            invalid={Boolean(errors.country)}
            describedBy={errors.country ? "country-error" : undefined}
            onSelect={(option) => onChange("country", option.key)}
            onBlur={() => onBlur("country")}
          />
        </FieldShell>

        <FieldShell id="phone" error={errors.phone}>
          <label htmlFor="phone" className={styles.label}>
            Phone number
          </label>
          <div className={styles.phoneRow}>
            <div className={styles.field}>
              <Combobox
                id="phoneCode"
                label="Country calling code"
                labelHidden
                options={codes}
                selectedKey={selectedCode?.key ?? ""}
                placeholder="Code"
                displayFor={(option) => codes.find((c) => c.key === option.key)?.value ?? option.label}
                invalid={Boolean(errors.phone)}
                describedBy={errors.phone ? "phone-error" : undefined}
                onSelect={(option) => onChange("phoneCode", codes.find((c) => c.key === option.key)?.value ?? "")}
              />
            </div>
            <input
              id="phone"
              type="tel"
              className={`${styles.input} ${errors.phone ? styles.invalid : ""}`}
              value={values.phone}
              maxLength={20}
              autoComplete="tel-national"
              placeholder="e.g. 801 234 5678"
              onChange={(event) => onChange("phone", event.target.value)}
              onBlur={() => onBlur("phone")}
              {...phoneAria}
            />
          </div>
        </FieldShell>

        {withCity ? (
          <>
          <SelectField
            id="city"
            label="City"
            value={values.city}
            placeholder={values.country ? "Select city" : "Select a country first"}
            disabled={!values.country}
            options={values.country ? [...cities, { value: OTHER_CITY, label: "Other (not listed)" }] : []}
            error={errors.city}
            onChange={(v) => onChange("city", v)}
            onBlur={() => onBlur("city")}
          />
          {values.city === OTHER_CITY ? (
            <TextField id="cityOther" label="Enter your city" value={values.cityOther} maxLength={100} full error={errors.cityOther} onChange={(v) => onChange("cityOther", v)} onBlur={() => onBlur("cityOther")} />
          ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
