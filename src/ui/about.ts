import { Info } from "lucide";
import { t } from "@/i18n";
import { icon } from "./icons";

type Credit = { name: string; url: string; license?: string };

// labelKey is an i18n key; project names and licenses are never translated
const groups: { labelKey: string; items: Credit[] }[] = [
  {
    labelKey: "about.libraries",
    items: [
      { name: "OpenLayers", url: "https://openlayers.org", license: "BSD-2-Clause" },
      { name: "Lucide", url: "https://lucide.dev", license: "ISC" },
      {
        name: "geocaching-base-converter",
        url: "https://github.com/surfoo/geocaching-base-converter",
        license: "MIT",
      },
    ],
  },
  {
    labelKey: "about.tools",
    items: [
      { name: "Vite", url: "https://vite.dev", license: "MIT" },
      { name: "TypeScript", url: "https://www.typescriptlang.org", license: "Apache-2.0" },
      { name: "Biome", url: "https://biomejs.dev", license: "MIT / Apache-2.0" },
      { name: "Vitest", url: "https://vitest.dev", license: "MIT" },
      { name: "jsdom", url: "https://github.com/jsdom/jsdom", license: "MIT" },
    ],
  },
  {
    labelKey: "about.data",
    items: [
      { name: "OpenStreetMap", url: "https://www.openstreetmap.org/copyright", license: "ODbL" },
      { name: "CyclOSM", url: "https://www.cyclosm.org" },
      { name: "OpenTopoMap", url: "https://opentopomap.org", license: "CC-BY-SA" },
    ],
  },
  {
    labelKey: "about.assets",
    items: [
      { name: "c:geo", url: "https://www.cgeo.org" },
      { name: "Simple Icons", url: "https://simpleicons.org", license: "CC0" },
      {
        name: "Space Grotesk",
        url: "https://fonts.google.com/specimen/Space+Grotesk",
        license: "OFL",
      },
    ],
  },
];

const renderCredits = (container: HTMLElement): void => {
  container.replaceChildren(
    ...groups.map(({ labelKey, items }) => {
      const section = document.createElement("section");
      const heading = document.createElement("h3");
      heading.textContent = t(labelKey);
      const list = document.createElement("ul");
      for (const { name, url, license } of items) {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = name;
        li.append(link);
        if (license) li.append(` (${license})`);
        list.append(li);
      }
      section.append(heading, list);
      return section;
    }),
  );
};

export const initAbout = (): void => {
  const button = document.querySelector<HTMLButtonElement>("#about-button");
  const dialog = document.querySelector<HTMLDialogElement>("#about-dialog");
  const credits = document.querySelector<HTMLElement>("#about-credits");
  if (!button || !dialog || !credits) return;

  button.replaceChildren(icon(Info));
  // rebuilt on open so the headings follow the current language
  button.addEventListener("click", () => {
    renderCredits(credits);
    dialog.showModal();
  });
  // a click on the backdrop targets the dialog itself
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
};
