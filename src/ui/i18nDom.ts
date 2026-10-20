import { applyDocumentLanguage, getLocale, locales, setLocale, t } from "@/i18n";

type I18nDomOptions = {
  languageSelect: HTMLSelectElement | null;
  onLocaleChange?: () => void;
};

export const initI18nDom = ({ languageSelect, onLocaleChange }: I18nDomOptions) => {
  const applyText = (): void => {
    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n ?? "";
      node.textContent = t(key);
    });

    document
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-i18n-placeholder]")
      .forEach((input) => {
        const key = input.dataset.i18nPlaceholder ?? "";
        input.placeholder = t(key);
      });

    document.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((node) => {
      const key = node.dataset.i18nAriaLabel ?? "";
      node.setAttribute("aria-label", t(key));
      node.setAttribute("title", t(key));
    });

    document.querySelectorAll<HTMLMetaElement>("[data-i18n-meta]").forEach((meta) => {
      const key = meta.dataset.i18nMeta ?? "";
      meta.content = t(key);
    });

    applyDocumentLanguage();
  };

  const populateLanguages = (): void => {
    if (!languageSelect) return;
    languageSelect.innerHTML = locales
      .map(
        (locale) =>
          `<option value="${locale.code}" ${locale.code === getLocale() ? "selected" : ""}>${locale.label}</option>`,
      )
      .join("");
  };

  populateLanguages();
  applyText();
  document.body.classList.remove("is-loading");

  languageSelect?.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value as (typeof locales)[number]["code"];
    setLocale(value);
    applyText();
    onLocaleChange?.();
  });

  return { applyText };
};
