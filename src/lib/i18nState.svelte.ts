// The language the widget translates into, as reactive state so that every
// template and `$derived` that calls `t` updates when it changes. As upstream's
// single i18next instance, it is shared by every widget on the page.
export const i18nState = $state({ language: "en-US" });
