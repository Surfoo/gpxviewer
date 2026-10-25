import { t } from "@/i18n";
import { searchCaches } from "@/map/search";
import type { CacheFeature } from "@/types";

const MAX_RESULTS = 8;

type SearchBoxOptions = {
  input: HTMLInputElement;
  list: HTMLUListElement;
  getFeatures: () => CacheFeature[];
  onSelect: (feature: CacheFeature) => void;
  onNotFound: (query: string) => void;
};

// Search field with a suggestion list (ARIA combobox: arrows, Enter, Escape, click).
export const initSearchBox = ({
  input,
  list,
  getFeatures,
  onSelect,
  onNotFound,
}: SearchBoxOptions): void => {
  let results: CacheFeature[] = [];
  let active = -1;

  const setActive = (index: number): void => {
    active = index;
    const options = list.querySelectorAll<HTMLElement>('[role="option"]');
    options.forEach((option, i) => {
      option.setAttribute("aria-selected", String(i === index));
      option.classList.toggle("is-active", i === index);
    });
    if (index < 0) {
      input.removeAttribute("aria-activedescendant");
      return;
    }
    input.setAttribute("aria-activedescendant", options[index].id);
    options[index].scrollIntoView({ block: "nearest" });
  };

  const close = (): void => {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    setActive(-1);
  };

  const choose = (feature: CacheFeature): void => {
    close();
    onSelect(feature);
  };

  const option = (feature: CacheFeature, index: number): HTMLLIElement => {
    const item = document.createElement("li");
    item.id = `search-option-${index}`;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", "false");
    const name = document.createElement("span");
    name.className = "search-name";
    name.textContent = feature.get<string>("name");
    const code = document.createElement("span");
    code.className = "search-code";
    code.textContent = feature.get<string>("code");
    item.append(name, code);
    // keep the focus in the input so blur does not close the list first
    item.addEventListener("mousedown", (event) => event.preventDefault());
    item.addEventListener("click", () => choose(feature));
    return item;
  };

  const render = (): void => {
    const all = searchCaches(getFeatures(), input.value);
    results = all.slice(0, MAX_RESULTS);
    const items: HTMLLIElement[] = results.map(option);
    if (all.length > results.length) {
      const more = document.createElement("li");
      more.setAttribute("role", "presentation");
      more.className = "search-more";
      more.textContent = t("search.more", { count: all.length - results.length });
      items.push(more);
    }
    list.replaceChildren(...items);
    list.hidden = results.length === 0;
    input.setAttribute("aria-expanded", String(!list.hidden));
    setActive(-1);
  };

  input.addEventListener("input", render);
  input.addEventListener("focus", () => {
    if (input.value.trim()) render();
  });
  input.addEventListener("blur", close);

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (list.hidden) render();
      if (results.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((active + step + results.length) % results.length);
    } else if (event.key === "Escape" && !list.hidden) {
      event.preventDefault(); // otherwise the browser also clears the field
      close();
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active >= 0) return choose(results[active]);
      const [first] = searchCaches(getFeatures(), input.value);
      if (first) choose(first);
      else if (input.value.trim()) onNotFound(input.value.trim());
    }
  });
};
